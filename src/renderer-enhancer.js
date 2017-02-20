const { ipcRenderer, remote } = require('electron');
const { globalName } = require('./constants');
const objectMerge = require('./utils/object-merge').default;
const setupStore = require('./setup-store');

const defaultParams = {
  filter: true,
  excludeUnfilteredState: false,
  postDispatchCallback: () => null,
  preDispatchCallback: () => null,
  dispatchProxy: null,
  actionFilter: () => true,
}

module.exports = overrides => storeCreator => (reducer, providedInitialState) => {
    const params = Object.assign({}, defaultParams, params);

    // Get data from the electronEnhanced store in the browser through the global it creates
    let getInitialState = remote.getGlobal(globalName);
    if (!getInitialState) {
      throw new Error('Could not find electronEnhanced redux store in main process');
    }

    // Prefetch initial state
    const storeData = JSON.parse(getInitialState());
    const preload = params.excludeUnfilteredState ? fillShape(storeData, filter) : storeData;
    const initialState = objectMerge(providedInitialState || {}, preload);

    const rendererId = process.guestInstanceId || remote.getCurrentWindow().id;
    const clientId = process.guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;

    const forwarder = (payload) =>
        ipcRenderer.send(`${globalName}-renderer-dispatch`, JSON.stringify({action: payload, clientId}));

    const context = {
      params,
      flags: {
        isDispatching: false,
        isUpdating: false,
      },
      storeCreator,
      reducer,
      initialState,
      forwarder,
    };

    const store = setupStore(context);

    ipcRenderer.send(`${globalName}-register-renderer`, { filter: params.filter, clientId });

    // Dispatches from other processes are forwarded using this ipc message
    const dispatcher = context.params.dispatchProxy || store.dispatch;
    ipcRenderer.on(`${globalName}-browser-dispatch`, (event, { action, sourceClientId }) => {
      console.log('GOT UPDATE');
      const actionParsed = JSON.parse(action);
      context.flags.isUpdating = true;
      dispatcher(actionParsed);
    });

    return store;
}
