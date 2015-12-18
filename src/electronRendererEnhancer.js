import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import _ from 'lodash';

let globalName = '__REDUX_ELECTRON_STORE__';

export default function electronRendererEnhancer(params = {}) {
  let {filter, excludeUnfilteredState, synchronous, postDispatchCallback, preDispatchCallback, stateTransformer} = params;

  postDispatchCallback = postDispatchCallback || (() => null);
  preDispatchCallback = preDispatchCallback || (() => null);
  excludeUnfilteredState = excludeUnfilteredState || false;
  synchronous = synchronous !== undefined ? synchronous : true;
  stateTransformer = stateTransformer || ((state) => state);
  filter = filter || true;

  return (storeCreator) => {
    return (reducer, initialState = {}) => {
      let { ipcRenderer } = require('electron');
      let remote = require('remote');
      let browserStore = remote.getGlobal(globalName);
      let rendererId = process.guestInstanceId || remote.getCurrentWindow().id;
      let storeData = browserStore.getState();
      let filteredStoreData = excludeUnfilteredState ? fillShape(storeData, filter) : storeData;
      let preload = stateTransformer(_.cloneDeep(filteredStoreData));
      let newInitialState = objectMerge(initialState, preload);
      let source = process.guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;

      let parsedReducer = (state = newInitialState, action) => {
        if (!action.source) return state;
        if (!synchronous || action.source !== source) {
          let filteredState = filterObject(state, action.data.deleted);
          return objectMerge(filteredState, action.data.updated);
        }

        let reduced = reducer(state, action);
        return excludeUnfilteredState ? fillShape(reduced, filter) : reduced;
      };


      let store = storeCreator(parsedReducer, newInitialState);

      ipcRenderer.send(`${globalName}-register-renderer`, {filter});
      ipcRenderer.on(`${globalName}-browser-dispatch`, (event, action) => {
        if (!synchronous || action.source !== source) {
          store.dispatch(action);
        }
      });

      let oldDispatchMethod = store.dispatch;
      store.dispatch = (action) => {
        action.source = action.source || source;

        if (synchronous || action.source !== source) {
          preDispatchCallback(action);
          oldDispatchMethod(action);
          postDispatchCallback(action);
        }

        if (action.source === source) {
          ipcRenderer.send(`${globalName}-renderer-dispatch`, action);
        }
      };

      return store;
    };
  };
}
