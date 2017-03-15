const { ipcRenderer, remote } = require('electron');
const { globalName } = require('./constants');
const objectMerge = require('./utils/object-merge');
const fillShape = require('./utils/fill-shape');
const setupStore = require('./setup-electron-store');

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 * @param {Object} p - The parameters to the creator
 * @param {Object|Function|true} p.filter - Describes what data should be forwarded to this process
 *                                          from the browser
 * @param {Boolean} p.excludeUnfilteredState - Whether to have all data not passing the filter to be
 *                                             undefined (Helpful to avoid bugs at the cost of
 *                                             performance)
 * @param {Function} p.postDispatchCallback - A callback to run after a dispatch has occurred.
 * @param {Function} p.preDispatchCallback - A callback to run before an action is dispatched.
 * @param {Function} p.dispatchProxy - In order to allow the actions dispatched by electronEnhancer
 *                                     to pass through the entire store enhancer stack, the final
 *                                     store.dispatch must be injected into redux-electron-store
 *                                     manually.
 * @param {Function} p.actionFilter - A function which takes in an action and returns a boolean
 *                                    determining whether to forward the action to other processes
 *                                    or not
 */
const defaultParams = {
  filter: true,
  excludeUnfilteredState: false,
  postDispatchCallback: () => null,
  preDispatchCallback: () => null,
  dispatchProxy: null,
  actionFilter: () => true,
};
module.exports = overrides => storeCreator => (reducer, providedInitialState) => {
  const params = Object.assign({}, defaultParams, overrides);

  const rendererId = process.guestInstanceId || remote.getCurrentWindow().id;
  const clientId = process.guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;

  // Allows the main process to forward updates to this renderer automatically
  ipcRenderer.send(`${globalName}-register-renderer`, { filter: params.filter, clientId });

  // Get current from the electronEnhanced store in the browser through the global it creates
  let getInitialState = remote.getGlobal(globalName);
  if (!getInitialState) throw new Error('Could not find electronEnhanced redux store in main process');
  const storeData = JSON.parse(getInitialState());
  const preload = params.excludeUnfilteredState ? fillShape(storeData, params.filter) : storeData;
  const initialState = objectMerge(providedInitialState || {}, preload);

  // Forward update to the main process so that it can forward the update to all other renderers
  const forwarder = (action) =>
      ipcRenderer.send(`${globalName}-renderer-dispatch`, clientId, JSON.stringify(action));

  const context = {
    params,
    flags: {
      isDispatching: false,
      isUpdating: false,
      forwardOnUpdate: false,
    },
    storeCreator,
    reducer,
    initialState,
    forwarder,
  };

  const store = setupStore(context);

  // Dispatches from other processes are forwarded using this ipc message
  const dispatcher = context.params.dispatchProxy || store.dispatch;
  ipcRenderer.on(`${globalName}-browser-dispatch`, (event, stringifiedAction) => {
    context.flags.isUpdating = true;
    const action = JSON.parse(stringifiedAction);
    dispatcher(action);
  });

  return store;
};
