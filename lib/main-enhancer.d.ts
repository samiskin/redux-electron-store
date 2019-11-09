import { AnyAction } from "redux";
import { ElectronEnhancer } from "./types";
export declare const defaultParams: {
    postDispatchCallback: (action: AnyAction) => null;
    preDispatchCallback: (action: AnyAction) => null;
    actionFilter: () => boolean;
};
/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 */
export declare const mainEnhancer: ElectronEnhancer;
