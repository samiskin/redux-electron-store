const ipcRenderer = require('electron').ipcRenderer;
import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import cloneDeep from 'lodash.cloneDeep';

import ReduxElectronStore from './redux-electron-store';

/**
 *
 *
 *
 *
 */
export default class ReduxRendererStore extends ReduxElectronStore {

  constructor({createReduxStore, reducer, filter, excludeUnfilteredState}) {
    super();

    let remote = require('remote');
    let browserStore = remote.getGlobal(this.globalName);

    this.windowId = remote.getCurrentWindow().id;
    this.filter = filter || true;
    this.excludeUnfilteredState = excludeUnfilteredState || false;

    // The object returned here is out of our control and may be mutated
    let storeData = browserStore.reduxStore.getState();
    let filteredStoreData = this.excludeUnfilteredState ? fillShape(storeData, this.filter) : storeData;

    // Objects that are remoted in have getters and setters added onto them.
    // This breaks things like redux-immutable-state-invariant as they are state mutations
    this.preload = cloneDeep(filteredStoreData);
    this.reduxStore = createReduxStore(this._parseReducer(reducer));

    ipcRenderer.send(`${this.globalName}-register-renderer`, {windowId: this.windowId, filter: this.filter});

    ipcRenderer.on(`${this.globalName}-browser-dispatch`, (event, action) => {
      this.reduxStore.dispatch(action);
    });
  }

  _parseReducer(reducer) {
    return (state, action) => {
      if (action.type === '@@INIT') return this.preload;

      let filteredState = filterObject(state, action.data.deleted);
      return objectMerge(filteredState, action.data.updated);
    };
  }

  dispatch(action) {
    action.source = `renderer ${this.windowId}`;
    ipcRenderer.send(`${this.globalName}-renderer-dispatch`, action);
  }
}

/**
 *
 *
 */
class ReduxRendererSyncStore extends ReduxRendererStore {

  dispatch(action) {
    action.source = `renderer ${this.windowId}`;
    super.dispatch(action);
  }

  _parseReducer(reducer) {
    return (state, action) => {
      if (action.type === '@@INIT') return this.preload;

      if (action.source === 'browser') {
        let filteredState = filterObject(state, action.data.deleted);
        return objectMerge(filteredState, action.data.updated);
      }

      let reduced = reducer(state, action);
      return this.excludeUnfilteredState ? fillShape(reduced, this.filter) : reduced;
    };
  }

}

export {
  ReduxRendererStore,
  ReduxRendererSyncStore
};
