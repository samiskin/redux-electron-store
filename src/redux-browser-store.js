const ipcMain = require('electron').ipcMain;

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

  constructor({createReduxStore, reducer}) {
    super();
    this.reduxStore = createReduxStore(this._parseReducer(reducer));

    this.windows = {}; // windowId -> webContents
    this.filters = {}; // windowId -> Object/function/true

    ipcMain.on(`${this.globalName}-renderer-dispatch`, (event, action) => {
      this.dispatch(action);
    });

    ipcMain.on(`${this.globalName}-register-renderer`, ({sender}, {windowId, filter}) => {
      this.windows[windowId] = sender;
      this.filters[windowId] = filter;
    });
  }

  unregisterWindow(windowId) {
    delete this.windows[windowId];
    delete this.filters[windowId];
  }

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

      if (!isEmpty(updated) || !isEmpty(deleted)) {
        let payload = Object.assign({}, action, { data: {updated, deleted} });
        this.windows[windowId].send(`${this.globalName}-browser-dispatch`, payload);
      }
    }
  }

}

