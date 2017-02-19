import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';
import isEmpty from 'lodash/isEmpty';
import getSubscribeFuncs from './getSubscribeFuncs.js';

import { globalName } from './constants';

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
export default function electronBrowserEnhancer({
  postDispatchCallback: postDispatchCallback = (() => null),
  preDispatchCallback: preDispatchCallback = (() => null),
  dispatchProxy: dispatchProxy = null,
} = {}) {
  return (storeCreator) => {
    return (reducer, initialState) => {
      let { ipcMain } = require('electron');

      let store = storeCreator(reducer, initialState);

      // Give renderers a way to sync the current state of the store, but be sure we don't
      // expose any remote objects. In other words, we need to rely exclusively on primitive
      // data types, Arrays, or Buffers. Refer to:
      // https://github.com/electron/electron/blob/master/docs/api/remote.md#remote-objects
      global[globalName] = () => JSON.stringify(store.getState());

      let clients = {}; // webContentsId -> {webContents, filter, clientId, windowId, active}

      // Need to keep track of windows, as when a window refreshes it creates a new
      // webContents, and the old one must be unregistered
      let windowMap = {}; // windowId -> webContentsId

      let currentSource = 'main_process';

      // Cannot delete data, as events could still be sent after close
      // events when a BrowserWindow is created using remote
      let unregisterRenderer = (webContentsId) => {
        clients[webContentsId].active = false;
      };

      // This must be kept in an object to be accessed by reference
      // by the subscribe function
      let reduxState = { isDispatching: false };

      let storeDotDispatch = store.dispatch;
      let doDispatch = (action) => {
        reduxState.isDispatching = true;
        try {
          preDispatchCallback(action);
          storeDotDispatch(action);
        } finally {
          reduxState.isDispatching = false;
        }
      };

      ipcMain.on(`${globalName}-register-renderer`, ({ sender }, { filter, clientId }) => {
        let webContentsId = sender.getId();
        clients[webContentsId] = {
          webContents: sender,
          filter,
          clientId,
          windowId: sender.getOwnerBrowserWindow().id,
          active: true
        };

        if (!sender.isGuest()) { // For windowMap (not webviews)
          let browserWindow = sender.getOwnerBrowserWindow();
          if (windowMap[browserWindow.id] !== undefined) {
            unregisterRenderer(windowMap[browserWindow.id]);
          }
          windowMap[browserWindow.id] = webContentsId;

          // Webcontents aren't automatically destroyed on window close
          browserWindow.on('closed', () => unregisterRenderer(webContentsId));
        }
      });

      let senderClientId = null;

      // Augment the subscribe function to make the listeners happen after the action is forwarded
      let subscribeFuncs = getSubscribeFuncs();
      store.subscribe = (listener) => subscribeFuncs.subscribe(listener, reduxState);

      store.dispatch = (action) => {
        if (!action) {
          storeDotDispatch(action);
        } else {
          let prevState = store.getState();
          doDispatch(action);
          let newState = store.getState();
          let stateDifference = objectDifference(prevState, newState);

          // Forward all actions to the listening renderers
          for (let webContentsId in clients) {
            if (!clients[webContentsId].active) continue;

            let webContents = clients[webContentsId].webContents;

            if (webContents.isDestroyed() || webContents.isCrashed()) {
              unregisterRenderer(webContentsId);
              continue;
            }

            let shape = clients[webContentsId].filter;
            let updated = fillShape(stateDifference.updated, shape);
            let deleted = fillShape(stateDifference.deleted, shape);

            // If any data the renderer is watching changes, send an ipc
            // call to inform it of the updated and deleted data
            if (!isEmpty(updated) || !isEmpty(deleted)) {
              let payload = Object.assign({}, action, { data: { updated, deleted } });
              let transfer = { action: JSON.stringify(payload), sourceClientId: senderClientId || currentSource };
              webContents.send(`${globalName}-browser-dispatch`, transfer);
            }
          }
        }

        senderClientId = null;
        subscribeFuncs.callListeners();
        postDispatchCallback(action);

        return action;
      };

      let dispatcher = dispatchProxy || store.dispatch;
      ipcMain.on(`${globalName}-renderer-dispatch`, ({ sender }, payload) => {
        let { action, clientId } = JSON.parse(payload);
        senderClientId = clientId;
        dispatcher(action);
        senderClientId = null;
      });

      return store;
    };
  };
}
