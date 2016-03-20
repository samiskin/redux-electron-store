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
 * @param {String} p.sourceName - An override to the 'source' property appended to every action
*/
export default function electronRendererEnhancer({
  filter: filter = true,
  excludeUnfilteredState: excludeUnfilteredState = false,
  synchronous: synchronous = true,
  postDispatchCallback: postDispatchCallback = (() => null),
  preDispatchCallback: preDispatchCallback = (() => null),
  stateTransformer: stateTransformer = ((state) => state),
  sourceName: sourceName = null
} = {}) {
  return (storeCreator) => {
    return (reducer, initialState) => {
      let { ipcRenderer } = require('electron');
      let remote = require('remote');

      // If this process is a webview, it will have a guestInstanceId.  Otherwise it is a window
      let rendererId = process.guestInstanceId || remote.getCurrentWindow().id;

      // Get current data from the electronEnhanced store in the browser throughthe global it creates
      let browserStore = remote.getGlobal(globalName);
      let storeData = browserStore.getState();
      let filteredStoreData = excludeUnfilteredState ? fillShape(storeData, filter) : storeData;
      let preload = stateTransformer(_.cloneDeep(filteredStoreData)); // Clonedeep is used as remote'd objects are handled in a unique way (breaks redux-immutable-state-invariant)
      let newInitialState = objectMerge(initialState || reducer(undefined, {type: null}), preload);

      let clientId = process.guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;
      let currentSource = sourceName || clientId;

      // Dispatches from the browser are in the format of {type, data: {updated, deleted}}.
      let parsedReducer = (state = newInitialState, action) => {
        if (action.from_redux_electron_store) {
          let data = action.data;
          data.deleted = stateTransformer(data.deleted);
          data.updated = stateTransformer(data.updated);
          let filteredState = filterObject(state, data.deleted);
          return objectMerge(filteredState, data.updated);
        } else {
          let reduced = reducer(state, action);
          return excludeUnfilteredState ? fillShape(reduced, filter) : reduced;
        }
      };

      let store = storeCreator(parsedReducer, newInitialState);

      // Renderers register themselves to the electronEnhanced store in the browser proecss
      ipcRenderer.send(`${globalName}-register-renderer`, { filter, clientId });

      let storeDotDispatch = store.dispatch;
      let doDispatch = (action) => {
        preDispatchCallback(action);
        storeDotDispatch(action);
        postDispatchCallback(action);
      };

      // Dispatches from other processes are forwarded using this ipc message
      ipcRenderer.on(`${globalName}-browser-dispatch`, (event, { action, sourceClientId }) => {
        action = JSON.parse(action);
        action.from_redux_electron_store = true;
        if (!synchronous || sourceClientId !== clientId) {
          doDispatch(action);
        }
      });

      store.dispatch = (action) => {
        if (!action) return;
        action.source = currentSource;

        if (synchronous) {
          doDispatch(action);
        }

        ipcRenderer.send(`${globalName}-renderer-dispatch`, JSON.stringify(action));
      };

      return store;
    };
  };
}
