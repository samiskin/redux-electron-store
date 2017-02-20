const isEmpty = require('lodash/isEmpty');
const filterObject = require('./utils/filter-object');
const objectMerge = require('./utils/object-merge');
const objectDifference = require('./utils/object-difference');
const fillShape = require('./utils/fill-shape');

function getSubscribeFuncs() {
  let currentListeners = [];
  let nextListeners = currentListeners;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  return {
    subscribe: (flags, listener) => {
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

module.exports = ({ params, flags, storeCreator, reducer, initialState, forwarder }) => {
  const parsedReducer = (state, action) => {
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
  store.subscribe = listener => subscribe(flags, listener);

  const storeDotDispatch = store.dispatch;
  const doDispatch = (action) => {
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
