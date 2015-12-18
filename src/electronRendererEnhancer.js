import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import _ from 'lodash';

let globalName = '__REDUX_ELECTRON_STORE__';

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 * @param {Object} p - The parameters to the creator
 * @param {Object|Function|true} p.filter - Describes what data should be forwarded to this process from the browser
 * @param {Boolean} p.excludeUnfilteredState - Whether to have all data not passing the filter to be undefined (Helpful to avoid bugs at the cost of performance)
 * @param {Boolean} p.synchronous - Whether dispatches from this process should be processed within this process synchronously, or await an update from the browser process
 * @param {Function} p.stateTransformer - A function that takes data from the browser store and returns an object in the proper format of the renderer's data (if you have different reducers between processes)
 * @param {Function} p.postDispatchCallback - A callback to run after a dispatch has occurred.
 * @param {Function} p.preDispatchCallback - A callback to run before an action is dispatched.
*/
export default function electronRendererEnhancer({
  filter: filter = true,
  excludeUnfilteredState: excludeUnfilteredState = false,
  synchronous: synchronous = true,
  postDispatchCallback: postDispatchCallback = (() => null),
  preDispatchCallback: preDispatchCallback = (() => null),
  stateTransformer: stateTransformer = ((state) => state)
}) {
  return (storeCreator) => {
    return (reducer, initialState = {}) => {
      let { ipcRenderer } = require('electron');
      let remote = require('remote');

      // If this process is a webview, it will have a guestInstanceId.  Otherwise it is a window
      let rendererId = process.guestInstanceId || remote.getCurrentWindow().id;

      // Get current data from the electronEnhanced store in the browser throughthe global it creates
      let browserStore = remote.getGlobal(globalName);
      let storeData = browserStore.getState();
      let filteredStoreData = excludeUnfilteredState ? fillShape(storeData, filter) : storeData;
      let preload = stateTransformer(_.cloneDeep(filteredStoreData)); // Clonedeep is used as remote'd objects are handled in a unique way (breaks redux-immutable-state-invariant)
      let newInitialState = objectMerge(initialState, preload);

      let currentSource = process.guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;

      // Dispatches from the browser are in the format of {type, data: {updated, deleted}}.
      let parsedReducer = (state = newInitialState, action) => {
        if (!action.source) return state; // If its not from an electronEnhanced store, ignore it
        action.data.deleted = stateTransformer(action.data.deleted);
        action.data.updated = stateTransformer(action.data.updated);
        if (!synchronous || action.source !== currentSource) {
          let filteredState = filterObject(state, action.data.deleted);
          return objectMerge(filteredState, action.data.updated);
        }

        let reduced = reducer(state, action);
        return excludeUnfilteredState ? fillShape(reduced, filter) : reduced;
      };

      let store = storeCreator(parsedReducer, newInitialState);

      // Renderers register themselves to the electronEnhanced store in the browser proecss
      ipcRenderer.send(`${globalName}-register-renderer`, {filter});

      // Dispatches from other processes are forwarded using this ipc message
      ipcRenderer.on(`${globalName}-browser-dispatch`, (event, action) => {
        if (!synchronous || action.source !== currentSource) {
          store.dispatch(action);
        }
      });

      let oldDispatchMethod = store.dispatch;
      store.dispatch = (action) => {
        action.source = action.source || currentSource;

        if (synchronous || action.source !== currentSource) {
          preDispatchCallback(action);
          oldDispatchMethod(action);
          postDispatchCallback(action);
        }

        if (action.source === currentSource) {
          ipcRenderer.send(`${globalName}-renderer-dispatch`, action);
        }
      };

      return store;
    };
  };
}
