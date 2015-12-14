const ipcRenderer = require('electron').ipcRenderer;
import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import cloneDeep from 'lodash.cloneDeep';

import ReduxElectronStore from './redux-electron-store';

export default class ReduxRendererStore extends ReduxElectronStore {

  constructor(reduxStoreCreator, reducer) {
    super();

    let remote = require('remote');
    this.windowId = remote.getCurrentWindow().id;
    let browserStore = remote.getGlobal(this.globalName);
    this.filter = browserStore.filters[this.windowId];

    // The object returned here is out of our control and may be mutated
    this.preload = cloneDeep(fillShape(browserStore.reduxStore.getState(), this.filter));
    this.reduxStore = reduxStoreCreator(this.parseReducer(reducer));

    ipcRenderer.on('browser-dispatch', (event, action) => {
      this.reduxStore.dispatch(action);
    });
  }

  parseReducer(reducer) {
    return (state, action) => {
      if (action.type === '@@INIT') return this.preload;

      let filteredState = filterObject(state, action.data.deleted);
      return objectMerge(filteredState, action.data.updated);
    };
  }

  dispatch(action) {
    action.source = `renderer ${this.windowId}`;
    ipcRenderer.send('renderer-dispatch', action);
  }
}

class ReduxRendererSyncStore extends ReduxRendererStore {

  dispatch(action) {
    action.source = `renderer ${this.windowId}`;
    super.dispatch(action);
  }

  parseReducer(reducer) {
    return (state, action) => {
      if (action.type === '@@INIT') return this.preload;

      if (action.source === 'browser') {
        let filteredState = filterObject(state, action.data.deleted);
        return objectMerge(filteredState, action.data.updated);
      }

      return reducer(state, action);
    };
  }

}

export {
  ReduxRendererStore,
  ReduxRendererSyncStore
};
