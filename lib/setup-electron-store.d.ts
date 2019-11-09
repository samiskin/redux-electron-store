import { AnyAction, DeepPartial, Reducer, Store, StoreCreator } from 'redux';
import { defaultParams } from "./main-enhancer";
import { Options } from "./types";
interface Flags {
    isUpdating: boolean;
    isDispatching: boolean;
    forwardOnUpdate: boolean;
    senderClientId?: string | null;
}
export interface SetupElectronStoreContext {
    params: Options & typeof defaultParams;
    flags: Flags;
    storeCreator: StoreCreator;
    reducer: Reducer<any, any>;
    initialState?: DeepPartial<any>;
    forwarder(action: AnyAction): void;
}
export declare const setupElectronStore: ({ params, flags, storeCreator, reducer, initialState, forwarder }: SetupElectronStoreContext) => Store<any, any>;
export {};
