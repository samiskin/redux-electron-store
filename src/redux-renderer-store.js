import { ipcRenderer } from 'electron';
import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import cloneDeep from 'lodash.cloneDeep';

import ReduxElectronStore from './redux-electron-store';

export default class ReduxRendererStore extends ReduxElectronStore {

  /**
   * Creates a store which registers itself to the browser store and
   * updates its own store based on dispatches from the browser
   * @class
   * @param {Object} p - The parameters
   * @param {Function} p.createReduxStore - The redux createStore function that takes in a reducer
   * @param {Function} p.reducer - The redux reducer you would normally pass in to createStore
   * @param {Function|Object|true} p.filter - A filter specifying what parameters this window listens to
   * @param {Boolean} p.excludeUnfilteredState - Whether all values not specified in the shape should be undefined
   * @param {Boolean} p.synchronous - Whether dispatches from this process should run in both this and the browser
   *                                  process, or allow all processing to be done in the browser process.
   */
  constructor({createReduxStore, reducer, filter, excludeUnfilteredState, synchronous}) {
    super();

    let remote = require('remote');
    let browserStore = remote.getGlobal(this.globalName);

    if (!browserStore) {
      throw new Error(`ReduxElectronStore must be created in the Browser process first`);
    }

    this.windowId = remote.getCurrentWindow().id;
    this.filter = filter || true;
    this.synchronous = synchronous || true;
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
      if (!this.synchronous || action.source !== this.getSource()) {
        this.reduxStore.dispatch(action);
      }
    });
  }

  _parseReducer(reducer) {
    return (state, action) => {
      if (action.type === '@@INIT') return this.preload;

      if (action.source !== this.getSource()) {
        let filteredState = filterObject(state, action.data.deleted);
        return objectMerge(filteredState, action.data.updated);
      }

      let reduced = reducer(state, action);
      return this.excludeUnfilteredState ? fillShape(reduced, this.filter) : reduced;
    };
  }

  /**
   * @return {string} - the value of "action.source" for actions originating from this process
   */
  getSource() {
    return `renderer ${this.windowId}`;
  }

  /**
   * Runs the dispatch if the store is synchronous, and forwards the action to the browser
   */
  dispatch(action) {
    action.source = this.getSource();
    if (this.synchronous) {
      super.dispatch(action);
    }

    ipcRenderer.send(`${this.globalName}-renderer-dispatch`, action);
  }
}
