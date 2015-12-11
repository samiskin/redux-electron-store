const ipcRenderer = require('electron').ipcRenderer;
import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';

import ReduxElectronStore from './redux-electron-store';

export default class ReduxRendererStore extends ReduxElectronStore {

  constructor(reduxStoreCreator, reducer) {
    super(reduxStoreCreator, reducer);
    this.windowId = require('remote').getCurrentWindow().id;

    ipcRenderer.on('browser-dispatch', (event, action) => {
      this.reduxStore.dispatch(action);
    });
  }

  parseReducer(reducer) {
    return (state, action) => {
      if (action.source === 'browser') {
        let filteredState = filterObject(state, action.data.deleted);
        return objectMerge(filteredState, action.data.updated);
      } else {
        return reducer(state, action);
      }
    }
  }

  dispatch(action) {
    action.source = `renderer ${this.windowId}`;
    ipcRenderer.send('renderer-dispatch', action);
  }
}
