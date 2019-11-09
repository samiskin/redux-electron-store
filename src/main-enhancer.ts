import { BrowserWindow, ipcMain } from "electron";
import isEmpty from "lodash/isEmpty";
import { AnyAction, StoreCreator, StoreEnhancerStoreCreator } from "redux";
import { Message } from "./constants";
import {
  setupElectronStore,
  SetupElectronStoreContext
} from "./setup-electron-store";
import { ElectronEnhancer, Options } from "./types";
import { fillShape } from "./utils/fill-shape";

export const defaultParams = {
  postDispatchCallback: (action: AnyAction) => null,
  preDispatchCallback: (action: AnyAction) => null,
  actionFilter: () => true
};

interface Client {
  active: boolean;
  webContents?: Electron.WebContents;
  filter?: any;
  clientId?: string;
  windowId?: number;
}

type Clients = {
  [key: string]: Client;
};

type WindowMap = {
  [key: string]: number | string;
};

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 */
export const mainEnhancer: ElectronEnhancer = (overrides?: Options) => (
  storeCreator: StoreCreator
): StoreEnhancerStoreCreator => {
  return (reducer, initialState) => {
    const params = Object.assign({}, defaultParams, overrides);
    let clients: Clients = {}; // webContentsId -> {webContents, filter, clientId, windowId, active}
    // Need to keep track of windows, as when a window refreshes it creates a new
    // webContents, and the old one must be unregistered
    let windowMap: WindowMap = {}; // windowId -> webContentsId
    // Cannot delete data, as events could still be sent after close
    // events when a BrowserWindow is created using remote
    const unregisterRenderer = (webContentsId: number | string) => {
      clients[webContentsId] = { active: false };
    };

    ipcMain.on(
      Message.RegisterRenderer,
      ({ sender }, { filter, clientId, isGuest }) => {
        let webContentsId = sender.id;
        let browserWindow = BrowserWindow.fromWebContents(sender);

        if (!isGuest) {
          // For windowMap (not webviews)
          if (windowMap[browserWindow.id] !== undefined) {
            // Occurs on window reload
            unregisterRenderer(windowMap[browserWindow.id]);
          }
          windowMap[browserWindow.id] = webContentsId;
          // Webcontents aren't automatically destroyed on window close
          browserWindow.on("closed", () => unregisterRenderer(webContentsId));
        }
        // Update clients after the unregisterRenderer method call(webContentsId should not be removed
        // after the window refresh).
        clients[webContentsId] = {
          webContents: sender,
          filter,
          clientId,
          windowId: browserWindow.id,
          active: true
        };
      }
    );

    const forwarder = ({ type, payload }: AnyAction) => {
      // Forward all actions to the listening renderers
      for (let webContentsId in clients) {
        if (!clients[webContentsId].active) continue;
        if (clients[webContentsId].clientId === context.flags.senderClientId)
          continue;
        let webContents = clients[webContentsId].webContents;
        if (
          !webContents ||
          webContents.isDestroyed() ||
          webContents.isCrashed()
        ) {
          unregisterRenderer(webContentsId);
          continue;
        }
        let shape = clients[webContentsId].filter;
        let updated = fillShape(payload.updated, shape);
        let deleted = fillShape(payload.deleted, shape);
        if (isEmpty(updated) && isEmpty(deleted)) {
          continue;
        }
        const action = { type, payload: { updated, deleted } };
        webContents.send(Message.BrowserDispatch, JSON.stringify(action));
      }
    };

    const context: SetupElectronStoreContext = {
      params,
      flags: {
        isDispatching: false,
        isUpdating: false,
        forwardOnUpdate: true,
        senderClientId: null
      },
      storeCreator,
      reducer,
      initialState,
      forwarder
    };

    const store = setupElectronStore(context);

    global["__REDUX_ELECTRON_STORE__InitialState"] = () =>
      JSON.stringify(store.getState());

    const dispatcher = params.dispatchProxy || store.dispatch;
    ipcMain.on(
      Message.RendererDispatch,
      (event, clientId, stringifiedAction) => {
        context.flags.isUpdating = true;
        const action = JSON.parse(stringifiedAction);
        context.flags.senderClientId = clientId;
        dispatcher(action);
        context.flags.senderClientId = null;
      }
    );

    return store;
  };
};
