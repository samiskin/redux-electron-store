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

    this.windows = {};
    this.filters = {};

    ipcMain.on('renderer-dispatch', (event, action) => {
      this.dispatch(action);
    });
  }

  registerWindow(browserWindow, filter = () => true) {
    this.windows[browserWindow.id] = browserWindow;
    this.filters[browserWindow.id] = filter;
  }

  unregisterWindow(winId) {
    delete this.windows[winId];
    delete this.filters[winId];
  }

  dispatch(action) {
    action.source = action.source || 'browser';
    let prevState = this.getState();
    super.dispatch(action);
    let newState = this.getState();

    let stateDifference = objectDifference(prevState, newState);

    for (let winId in this.windows) {
      let shape = this.filters[winId];
      let updated = fillShape(stateDifference.updated, shape);
      let deleted = fillShape(stateDifference.deleted, shape);

      if (!isEmpty(updated) || !isEmpty(deleted)) {
        let payload = Object.assign({}, action, { data: {updated, deleted} });
        this.windows[winId].webContents.send('browser-dispatch', payload);
      }
    }
  }

}

