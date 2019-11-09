import isEmpty from "lodash/isEmpty";
import { AnyAction, DeepPartial, Reducer, Store, StoreCreator } from 'redux';
import { defaultParams } from "./main-enhancer";
import { fillShape } from './utils/fill-shape';
import { filterObject } from "./utils/filter-object";
import { objectDifference } from "./utils/object-difference";
import { objectMerge } from "./utils/object-merge";
import { Options } from "./types";


type Listener = () => void;
interface Flags {
  isUpdating: boolean;
  isDispatching: boolean;
  forwardOnUpdate: boolean;
  senderClientId?: string | null;
}

function getSubscribeFuncs() {
  let currentListeners: Listener[] = [];
  let nextListeners = currentListeners;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  return {
    subscribe: (flags: Flags, listener: Listener) => {
      if (typeof listener !== 'function') {
        throw new Error('Expected listener to be a function.');
      }

      if (flags.isDispatching) {
        throw new Error('You may not call store.subscribe() while a reducer is executing');
      }

      let isSubscribed = true;
      ensureCanMutateNextListeners();
      nextListeners.push(listener);

      return function unsubscribe() {
        if (!isSubscribed) return;

        if (flags.isDispatching) {
          throw new Error('You may not unsubscribe from a store listener while the reducer is executing');
        }

        isSubscribed = false;
        ensureCanMutateNextListeners();
        nextListeners.splice(nextListeners.indexOf(listener), 1);
      };
    },
    callListeners: () => {
      const listeners = currentListeners = nextListeners;
      listeners.forEach(listener => listener());
    }
  };
}

export interface SetupElectronStoreContext {
  params: Options & typeof defaultParams;
  flags: Flags;
  storeCreator: StoreCreator;
  reducer: Reducer<any, any>;
  initialState?: DeepPartial<any>;
  forwarder(action: AnyAction): void;
}

export const setupElectronStore = ({ params, flags, storeCreator, reducer, initialState, forwarder }: SetupElectronStoreContext): Store<any, any> => {
  const parsedReducer = (state: any, action: AnyAction) => {
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
      params.preDispatchCallback(action);
      storeDotDispatch(action);
    } finally {
      flags.isDispatching = false;
    }
  };

  store.dispatch = (action) => {
    if (flags.isUpdating || !action || !params.actionFilter(action)) {
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
    params.postDispatchCallback(action);
    return action;
  };

  return store;
};
