import filterObject from './utils/filter-object';
import objectMerge from './utils/object-merge';
import fillShape from './utils/fill-shape';
import cloneDeep from 'lodash/cloneDeep';
import getSubscribeFuncs from './getSubscribeFuncs';

import { globalName } from './constants';

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 * @param {Object} p - The parameters to the creator
 * @param {Object|Function|true} p.filter - Describes what data should be forwarded to this process
 *                                          from the browser
 * @param {Boolean} p.excludeUnfilteredState - Whether to have all data not passing the filter to be
 *                                             undefined (Helpful to avoid bugs at the cost of
 *                                             performance)
 * @param {Boolean} p.synchronous - Whether dispatches from this process should be processed within
 *                                  this process synchronously, or await an update from the browser process
 * @param {Function} p.postDispatchCallback - A callback to run after a dispatch has occurred.
 * @param {Function} p.preDispatchCallback - A callback to run before an action is dispatched.
 * @param {Function} p.dispatchProxy - In order to allow the actions dispatched by electronEnhancer
 *                                     to pass through the entire store enhancer stack, the final
 *                                     store.dispatch must be injected into redux-electron-store
 *                                     manually.
 * @param {String} p.sourceName - An override to the 'source' property appended to every action
 * @param {Function} p.actionFilter - A function which takes in an action and returns a boolean
 *                                    determining whether to forward the action to other processes
 *                                    or not
 */
export default function electronRendererEnhancer({
  filter: filter = true,
  excludeUnfilteredState: excludeUnfilteredState = false,
  synchronous: synchronous = true,
  postDispatchCallback: postDispatchCallback = (() => null),
  preDispatchCallback: preDispatchCallback = (() => null),
  dispatchProxy: dispatchProxy = null,
  sourceName: sourceName = null,
  actionFilter: actionFilter = () => true,
} = {}) {
  return (storeCreator) => {
    return (reducer, initialState) => {
      let { ipcRenderer, remote } = require('electron');

      // If this process is a webview, it will have a guestInstanceId.  Otherwise it is a window
      let rendererId = process.guestInstanceId || remote.getCurrentWindow().id;

      // Get data from the electronEnhanced store in the browser through the global it creates
      let getInitialState = remote.getGlobal(globalName);
      if (!getInitialState) {
        throw new Error('Could not find electronEnhanced redux store in main process');
      }

      // Prefetch initial state
      let storeData = JSON.parse(getInitialState());
      let preload = excludeUnfilteredState ? fillShape(storeData, filter) : storeData;
      let newInitialState = objectMerge(initialState || {}, preload);

      let clientId = process.guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;
      let currentSource = sourceName || clientId;

      // This flag is toggled to true when events are received
      let mainProcessUpdateFlag = false;

      // Augment the reducer to handle electron enhanced actions that have been forwarded
      // Dispatches from the browser are in the format of {type, data: {updated, deleted}}.
      let parsedReducer = (state = newInitialState, action) => {
        if (mainProcessUpdateFlag) {
          mainProcessUpdateFlag = false;
          let data = action.data;
          let filteredState = filterObject(state, data.deleted);
          return objectMerge(filteredState, data.updated);
        } else {
          let reduced = reducer(state, action);
          return excludeUnfilteredState ? fillShape(reduced, filter) : reduced;
        }
      };

      let store = storeCreator(parsedReducer, newInitialState);

      // This must be kept in an object to be accessed by reference
      // by the subscribe function
      let reduxState = { isDispatching: false };

      // Augment the subscribe function to make the listeners happen after the action is forwarded
      let subscribeFuncs = getSubscribeFuncs();
      store.subscribe = (listener) => subscribeFuncs.subscribe(listener, reduxState);

      // Renderers register themselves to the electronEnhanced store in the browser proecss
      ipcRenderer.send(`${globalName}-register-renderer`, { filter, clientId });

      let storeDotDispatch = store.dispatch;
      let doDispatch = (action) => {
        reduxState.isDispatching = true;
        try {
          preDispatchCallback(action);
          storeDotDispatch(action);
        } finally {
          reduxState.isDispatching = false;
        }
      };

      store.dispatch = (action) => {
        if (mainProcessUpdateFlag || !action) {
          doDispatch(action);
        } else {
          action.source = currentSource;

          let shouldForwardUpdate = actionFilter(action);
          if (!shouldForwardUpdate || synchronous) {
            doDispatch(action);
          }

          if (shouldForwardUpdate) {
            ipcRenderer.send(
              `${globalName}-renderer-dispatch`,
              JSON.stringify({ action, clientId })
            );
          }
        }

        subscribeFuncs.callListeners();
        postDispatchCallback(action);
        return action;
      };

      // Dispatches from other processes are forwarded using this ipc message
      let dispatcher = dispatchProxy || store.dispatch;
      ipcRenderer.on(`${globalName}-browser-dispatch`, (event, { action, sourceClientId }) => {
        const actionParsed = JSON.parse(action);
        if (!synchronous || sourceClientId !== clientId) {
          mainProcessUpdateFlag = true;
          dispatcher(actionParsed);
          subscribeFuncs.callListeners();
          postDispatchCallback();
        }
      });

      return store;
    };
  };
}
