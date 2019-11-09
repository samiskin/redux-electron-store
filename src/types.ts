import {
  StoreCreator,
  StoreEnhancerStoreCreator,
  AnyAction,
  Dispatch
} from "redux";

export type ElectronEnhancer = (options?: Options) => callback;
type callback = (storeCreator: StoreCreator) => StoreEnhancerStoreCreator;

export interface Options {
  postDispatchCallback?: (action: AnyAction) => void;
  preDispatchCallback?: (action: AnyAction) => void;
  actionFilter?: (action: AnyAction) => boolean;
  dispatchProxy?: Dispatch;
  excludeUnfilteredState?: boolean;
  filter?: object;
}
