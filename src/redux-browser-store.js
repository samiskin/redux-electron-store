const ipcMain = require('electron').ipcMain;

import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';
import ReduxElectronStore from './redux-electron-store';

export default class ReduxBrowserStore extends ReduxElectronStore {

  constructor(reduxStoreCreator, reducer) {
    super(reduxStoreCreator, reducer);
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

      if (!_.isEmpty(updated) || !_.isEmpty(deleted)) {
        let payload = _.assign({}, action, { data: {updated, deleted} });
        this.windows[winId].webContents.send('browser-dispatch', payload);
      }
    }

  }

}

