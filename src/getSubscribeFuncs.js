export default function getSubscribeFuncs() {
  let currentListeners = [];
  let nextListeners = currentListeners;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  return {
    subscribe: (listener, isDispatching) => {
      if (typeof listener !== 'function') {
        throw new Error('Expected listener to be a function.');
      }

      if (isDispatching) {
        throw new Error('You may not call store.subscribe() while a reducer is executing');
      }

      let isSubscribed = true;
      ensureCanMutateNextListeners();
      nextListeners.push(listener);

      return function unsubscribe() {
        if (!isSubscribed) return;

        if (!isDispatching) {
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

