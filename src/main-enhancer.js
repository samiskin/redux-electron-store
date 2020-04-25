// {params, flags, storeCreator, reducer, initialState, forwarder}
const { ipcMain, BrowserView } = require('electron')
const { globalName } = require('./constants')
const fillShape = require('./utils/fill-shape')
const setupStore = require('./setup-electron-store')
const isEmpty = require('lodash/isEmpty')

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 * @param {Object} p - The parameters to the creator
 * @param {Function} p.postDispatchCallback - A callback to run after a dispatch has occurred.
 * @param {Function} p.preDispatchCallback - A callback to run before an action is dispatched.
 * @param {Function} p.dispatchProxy - In order to allow the actions dispatched by electronEnhancer
 *                                     to pass through the entire store enhancer stack, the final
 *                                     store.dispatch must be injected into redux-electron-store
 *                                     manually.
 */
const defaultParams = {
  postDispatchCallback: () => null,
  preDispatchCallback: () => null,
  dispatchProxy: null,
  actionFilter: () => true
}
module.exports = overrides => storeCreator => (reducer, initialState) => {
  const params = Object.assign({}, defaultParams, overrides)

  let clients = {} // webContentsId -> {webContents, filter, clientId, windowId, active}

  // Need to keep track of windows, as when a window refreshes it creates a new
  // webContents, and the old one must be unregistered
  let windowMap = {} // windowId -> webContentsId

  // Cannot delete data, as events could still be sent after close
  // events when a BrowserWindow is created using remote
  let unregisterRenderer = webContentsId => {
    clients[webContentsId] = { active: false }
  }

  ipcMain.on(
    `${globalName}-register-renderer`,
    ({ sender }, { filter, clientId, isGuest }) => {
      let webContentsId = sender.id

      if (!isGuest) {
        // For windowMap (not webviews)
        let browserWindow = sender.getOwnerBrowserWindow()
        let browserView = BrowserView.fromWebContents(sender)

        if (browserView) {
          if (viewMap[browserView.id]) {
            unregisterRenderer(windowMap[browserWindow.id])
          }
          viewMap[browserView.id] = webContentsId
        } else {
          if (windowMap[browserWindow.id]) {
            // Occurs on window reload            
            unregisterRenderer(windowMap[browserWindow.id])
          }
          windowMap[browserWindow.id] = webContentsId
        }

        // Webcontents aren't automatically destroyed on window close
        browserWindow.on('closed', () => unregisterRenderer(webContentsId))
      }

      // if webviews are reloaded, the contents id changes
      // so duplicates need to be removed
      Object.keys(clients).forEach(k => {
        if (clients[k].webContents === sender) {
          delete clients[k]
        }
      })

      clients[webContentsId] = {
        webContents: sender,
        filter,
        clientId: webContentsId,
        //windowId: sender.getOwnerBrowserWindow().id,
        active: true
      }
    }
  )

  const forwarder = ({ type, payload }) => {
    // Forward all actions to the listening renderers
    for (let webContentsId in clients) {
      if (!clients[webContentsId].active) continue
      if (clients[webContentsId].clientId === context.flags.senderClientId)
        continue

      let webContents = clients[webContentsId].webContents

      if (webContents.isDestroyed() || webContents.isCrashed()) {
        unregisterRenderer(webContentsId)
        continue
      }

      let shape = clients[webContentsId].filter
      let updated = fillShape(payload.updated, shape)
      let deleted = fillShape(payload.deleted, shape)

      if (isEmpty(updated) && isEmpty(deleted)) {
        continue
      }

      const action = { type, payload: { updated, deleted } }
      webContents.send(`${globalName}-browser-dispatch`, JSON.stringify(action))
    }
  }

  const context = {
    params,
    flags: {
      isDispatching: false,
      isUpdating: false,
      forwardOnUpdate: true,
      senderClientId: null
    },
    storeCreator,
    reducer,
    initialState,
    forwarder
  }

  const store = setupStore(context)

  // Give renderers a way to sync the current state of the store, but be sure we don't
  // expose any remote objects. In other words, we need to rely exclusively on primitive
  // data types, Arrays, or Buffers. Refer to:
  // https://github.com/electron/electron/blob/master/docs/api/remote.md#remote-objects
  global[globalName] = () => JSON.stringify(store.getState())

  const dispatcher = params.dispatchProxy || store.dispatch
  ipcMain.on(
    `${globalName}-renderer-dispatch`,
    (event, clientId, stringifiedAction) => {
      context.flags.isUpdating = true
      const action = JSON.parse(stringifiedAction)
      context.flags.senderClientId = event.sender.id
      dispatcher(action)
      context.flags.senderClientId = null
    }
  )

  return store
}
