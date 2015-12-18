import { ipcRenderer } from 'electron';
import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import _ from 'lodash';

import ReduxElectronStore from './redux-electron-store';

export default class ReduxRendererStore extends ReduxElectronStore {

  /**
   * Creates a store which registers itself to the browser store and
   * updates its own store based on dispatches from the browser
   * @class
   * @param {Object} p - The parameters
   * @param {Function} p.createReduxStore - The redux createStore function that takes in a reducer
   * @param {Function} p.reducer - The redux reducer you would normally pass in to createStore
   * @param {Function|Object|true} p.filter - A filter specifying what parameters this renderer listens to
   * @param {Boolean} p.excludeUnfilteredState - Whether all values not specified in the shape should be undefined
   * @param {Boolean} p.synchronous - Whether dispatches from this process should run in both this and the browser
   *                                  process, or allow all processing to be done in the browser process.
   */
  constructor(p) {
    super(p);
    let {createReduxStore, reducer, filter, excludeUnfilteredState, synchronous: synchronous = true} = p;

    let remote = require('remote');
    let browserStore = remote.getGlobal(this.globalName);

    if (!browserStore) {
      throw new Error(`ReduxElectronStore must be created in the Browser process first`);
    }

    // When this is instantiated inside a webview, process.guestInstanceId exists
    this.rendererId = process.guestInstanceId || remote.getCurrentWindow().id;

    this.filter = filter || true;
    this.synchronous = synchronous;
    this.excludeUnfilteredState = excludeUnfilteredState || false;

    // The object returned here is out of our control and may be mutated
    let storeData = browserStore.reduxStore.getState();
    let filteredStoreData = this.excludeUnfilteredState ? fillShape(storeData, this.filter) : storeData;

    // Objects that are remoted in have getters and setters added onto them.
    // This breaks things like redux-immutable-state-invariant as they are state mutations
    this.preload = _.cloneDeep(filteredStoreData);
    this.reduxStore = createReduxStore(this._parseReducer(reducer));

    ipcRenderer.send(`${this.globalName}-register-renderer`, {filter: this.filter});

    ipcRenderer.on(`${this.globalName}-browser-dispatch`, (event, action) => {
      if (!this.synchronous || action.source !== this.getSource()) {
        super.dispatch(action);
      }
    });
  }

  _parseReducer(reducer) {
    return (state, action) => {
      if (action.type === '@@INIT' || action.type === '@@redux/INIT') return this.preload;

      if (!this.synchronous || action.source !== this.getSource()) {
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
    if (process.guestInstanceId) {
      return `webview ${this.rendererId}`;
    } else {
      return `window ${this.rendererId}`;
    }
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
