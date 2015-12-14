const ipcMain = require('electron').ipcMain;

import { isEmpty } from './utils/lodash-clones';
import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';
import ReduxElectronStore from './redux-electron-store';

export default class ReduxBrowserStore extends ReduxElectronStore {

  constructor(reduxStoreCreator, reducer) {
    super();
    this.reduxStore = reduxStoreCreator(this.parseReducer(reducer));

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

