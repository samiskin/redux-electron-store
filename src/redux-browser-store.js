const ipcMain = require('electron').ipcMain;

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

    let payload = {type: action.type, data: stateDifference};

    for (let winId in this.windows) {
      if (this.filters[winId](prevState, newState)) {
        this.windows[winId].webContents.send('browser-dispatch', payload);
      }
    }

  }

}

