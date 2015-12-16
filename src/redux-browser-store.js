import { ipcMain } from 'electron';
import isEmpty from 'lodash.isempty';
import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';
import ReduxElectronStore from './redux-electron-store';

/**
 * Processes dispatches from either calls to `ReduxBrowserStore.dispatch`
 * or 'renderer-dispatch' ipc messages containing an action. On every
 * dispatch, any changed properties are forwarded to all renderers where
 * any of the changed properties pass the renderer's filter
 */
export default class ReduxBrowserStore extends ReduxElectronStore {

  /**
   * Creates a store which receives dispatches through IPC and function calls
   * and forwards all dispatches to renderers which register themselves through ipc.
   * @class
   * @param {Object} p - The parameters
   * @param {Function} p.createReduxStore - The redux createStore function that takes in a reducer
   * @param {Function} p.reducer - The redux reducer you would normally pass in to createStore
   */
  constructor({createReduxStore, reducer}) {
    super();
    this.reduxStore = createReduxStore(this._parseReducer(reducer));

    this.renderers = {}; // webContentsId -> webContents
    this.filters = {}; // webContentsId -> Object/function/true

    // TODO: Clean this up. This is needed because for some reason after
    // refresh, webContents.send on an old webContents will just send it to the
    // new webContents on that window
    this.windowIdsToContentsIds = {}; // windowId -> webContentsId

    ipcMain.on(`${this.globalName}-renderer-dispatch`, (event, action) => {
      this.dispatch(action);
    });

    ipcMain.on(`${this.globalName}-register-renderer`, ({sender}, {filter}) => {
      let webContentsId = sender.getId();
      this.renderers[webContentsId] = sender;
      this.filters[webContentsId] = filter;

      if (!sender.isGuest()) { // For windows (not webviews)
        let browserWindow = sender.getOwnerBrowserWindow();

        // TODO: Clean this up
        if (this.windowIdsToContentsIds[browserWindow.id] !== undefined) {
          this.unregisterRenderer(this.windowIdsToContentsIds[browserWindow.id]);
        }
        this.windowIdsToContentsIds[browserWindow.id] = webContentsId;

        // BrowserWindows closing don't seem to destroy the webContents
        browserWindow.on('closed', () => this.unregisterRenderer(webContentsId));
      }
    });
  }

  unregisterRenderer(webContentsId) {
    delete this.renderers[webContentsId];
    delete this.filters[webContentsId];
  }

  /**
   * Dispatches an action and then forwards the change to any
   * store who watches for changes in any of the changed properties
   * @param {Object} action - The redux action to dispatch
   */
  dispatch(action) {
    action.source = action.source || 'browser';

    let prevState = this.getState();
    super.dispatch(action);
    let newState = this.getState();
    let stateDifference = objectDifference(prevState, newState);

    for (let webContentsId in this.renderers) {

      let webContents = this.renderers[webContentsId];

      if (webContents.isDestroyed() || webContents.isCrashed()) {
        this.unregisterRenderer(webContentsId);
        return;
      }

      let shape = this.filters[webContentsId];
      let updated = fillShape(stateDifference.updated, shape);
      let deleted = fillShape(stateDifference.deleted, shape);

      // If any data the renderer is watching changes, send an ipc
      // call to inform it of the updated and deleted data
      if (!isEmpty(updated) || !isEmpty(deleted)) {
        let payload = Object.assign({}, action, { data: {updated, deleted} });
        webContents.send(`${this.globalName}-browser-dispatch`, payload);
      }
    }
  }

}

