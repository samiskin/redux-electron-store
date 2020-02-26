import {
  StoreCreator,
  StoreEnhancerStoreCreator,
  AnyAction,
  Dispatch
} from "redux";

export type ElectronEnhancer = (options?: Options) => callback;
type callback = (storeCreator: StoreCreator) => StoreEnhancerStoreCreator;

export interface Options<T = Record<string, unknown>> {
  postDispatchCallback?: (action: AnyAction) => void;
  preDispatchCallback?: (action: AnyAction) => void;
  actionFilter?: (action: AnyAction) => boolean;
  dispatchProxy?: Dispatch;
  /*
  This property is only available for the renderer process
  */
  excludeUnfilteredState?: boolean;
  /*
  This property is only available for the renderer process
  */
  filter?: { [key in keyof T]?: boolean } | boolean;
}

export interface Flags {
  isUpdating: boolean;
  isDispatching: boolean;
  forwardOnUpdate: boolean;
  senderClientId?: string | null;
}