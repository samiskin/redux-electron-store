import { ipcMain } from 'electron';
import { isEmpty } from './utils/lodash-clones';
import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';
import ReduxElectronStore from './redux-electron-store';


/**
 * Processes dispatches from either calls to `ReduxBrowserStore.dispatch`
 * or 'renderer-dispatch' ipc messages containing an action. On every
 * dispatch, any changed properties are forwarded to all windows where
 * any of the changed properties pass the window's filter
 */
export default class ReduxBrowserStore extends ReduxElectronStore {

  /**
   * Creates a store which receives dispatches through IPC and function calls
   * and forwards all dispatches to windows which register themselves through ipc.
   * @class
   * @param {Object} p - The parameters
   * @param {Function} p.createReduxStore - The redux createStore function that takes in a reducer
   * @param {Function} p.reducer - The redux reducer you would normally pass in to createStore
   */
  constructor({createReduxStore, reducer}) {
    super();
    this.reduxStore = createReduxStore(this._parseReducer(reducer));

    this.windows = {}; // windowId -> BrowserWindow.webContents
    this.filters = {}; // windowId -> Object/function/true

    ipcMain.on(`${this.globalName}-renderer-dispatch`, (event, action) => {
      this.dispatch(action);
    });

    ipcMain.on(`${this.globalName}-register-renderer`, ({sender}, {windowId, filter}) => {
      this.windows[windowId] = sender;
      this.filters[windowId] = filter;
    });
  }

  /**
   * Deletes all records of a window
   * @param {Number} windowId - the id of the window to unregister
   */
  unregisterWindow(windowId) {
    delete this.windows[windowId];
    delete this.filters[windowId];
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

    for (let windowId in this.windows) {
      let shape = this.filters[windowId];
      let updated = fillShape(stateDifference.updated, shape);
      let deleted = fillShape(stateDifference.deleted, shape);

      // If any data the window is watching changes, send an ipc
      // call to inform it of the updated and deleted data
      if (!isEmpty(updated) || !isEmpty(deleted)) {
        let payload = Object.assign({}, action, { data: {updated, deleted} });
        this.windows[windowId].send(`${this.globalName}-browser-dispatch`, payload);
      }
    }
  }

}

