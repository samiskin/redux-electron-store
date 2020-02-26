import isEmpty from "lodash/isEmpty";
import { AnyAction, DeepPartial, Reducer, Store, StoreCreator } from 'redux';
import { fillShape } from './utils/fill-shape';
import { filterObject } from "./utils/filter-object";
import { objectDifference } from "./utils/object-difference";
import { objectMerge } from "./utils/object-merge";
import { Options, Flags } from "./types";
import { getSubscribeFuncs } from "./subscribers";

export interface SetupElectronStoreContext {
  params: Options;
  flags: Flags;
  storeCreator: StoreCreator;
  reducer: Reducer<any, any>;
  initialState?: DeepPartial<any>;
  forwarder(action: AnyAction): void;
}

export const setupElectronStore = <S>({ params, flags, storeCreator, reducer, initialState, forwarder }: SetupElectronStoreContext): Store<any, any> => {
  const parsedReducer: Reducer = (state: S, action: AnyAction) => {
    if (flags.isUpdating) {
      flags.isUpdating = false;
      const { updated, deleted } = action.payload;
      const withDeletions = filterObject(state, deleted);
      return objectMerge(withDeletions, updated);
    } else {
      const reduced = reducer(state, action);
      return params.excludeUnfilteredState ? fillShape(reduced, params.filter) : reduced;
    }
  };

  const store = storeCreator(parsedReducer, initialState);
  const { subscribe, callListeners } = getSubscribeFuncs();
  store.subscribe = (listener) => subscribe(flags, listener);

  const storeDotDispatch = store.dispatch;
  const doDispatch = (action: AnyAction) => {
    flags.isDispatching = true;
    try {
      params.preDispatchCallback?.(action);
      storeDotDispatch(action);
    } finally {
      flags.isDispatching = false;
    }
  };

  store.dispatch = (action) => {
    const actionFilter = params.actionFilter === undefined || params.actionFilter?.(action);

    if (flags.isUpdating || !action || !actionFilter) {
      doDispatch(action);
      if (flags.forwardOnUpdate) {
        forwarder(action);
      }
    } else {
      const prevState = store.getState();
      doDispatch(action);
      const newState = store.getState();
      const delta = objectDifference(prevState, newState);

      if (isEmpty(delta.updated) && isEmpty(delta.deleted)) {
        return action;
      }
      forwarder({ type: action.type, payload: delta });
    }

    callListeners();
    params.postDispatchCallback?.(action);
    return action;
  };

  return store;
};
