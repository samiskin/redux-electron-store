import { ipcRenderer, remote } from "electron";
import { AnyAction, StoreCreator, StoreEnhancerStoreCreator } from "redux";
import { Global, Message } from "./constants";
import {
  setupElectronStore,
  SetupElectronStoreContext
} from "./setup-electron-store";
import { fillShape } from "./utils/fill-shape";
import { objectMerge } from "./utils/object-merge";
import { Options, ElectronEnhancer } from "./types";

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
  actionFilter: () => true
};
export const renderEnhancer: ElectronEnhancer = (overrides?: Options) => (
  storeCreator: StoreCreator
): StoreEnhancerStoreCreator => {
  return (reducer, providedInitialState) => {
    const params = Object.assign({}, defaultParams, overrides);

    const rendererId = process.guestInstanceId || remote.getCurrentWindow().id;
    const clientId = process.guestInstanceId
      ? `webview ${rendererId}`
      : `window ${rendererId}`;

    const isGuest = !!process.guestInstanceId;

    // Allows the main process to forward updates to this renderer automatically
    ipcRenderer.send(Message.RegisterRenderer, {
      filter: params.filter,
      clientId,
      isGuest
    });

    // Get current from the electronEnhanced store in the browser through the global it creates
    const getInitialState = remote.getGlobal(Global.InitialState);

    const storeData = JSON.parse(getInitialState());
    const preload = params.excludeUnfilteredState
      ? fillShape(storeData, params.filter)
      : storeData;
    const initialState = objectMerge(preload, providedInitialState || {});

    // Forward update to the main process so that it can forward the update to all other renderers
    const forwarder = (action: AnyAction) =>
      ipcRenderer.send(
        Message.RendererDispatch,
        clientId,
        JSON.stringify(action)
      );

    const context: SetupElectronStoreContext = {
      params,
      flags: {
        isDispatching: false,
        isUpdating: false,
        forwardOnUpdate: false
      },
      storeCreator,
      reducer,
      initialState,
      forwarder
    };

    const store = setupElectronStore(context);

    // Dispatches from other processes are forwarded using this ipc message
    const dispatcher = context.params.dispatchProxy || store.dispatch;
    ipcRenderer.on(Message.BrowserDispatch, (event, stringifiedAction) => {
      context.flags.isUpdating = true;
      const action = JSON.parse(stringifiedAction);
      dispatcher(action);
    });

    return store;
  };
};
