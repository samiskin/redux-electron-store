import { Flags } from "./types";

type Listener = () => void;

export function getSubscribeFuncs() {
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