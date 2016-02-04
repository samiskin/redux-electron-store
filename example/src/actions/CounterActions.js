import Store from 'Store';

export const INCREMENT_COUNTER = 'INCREMENT_COUNTER'; // Symbol('CLICK');
export const DECREMENT_COUNTER = 'DECREMENT_COUNTER';

class CounterActions {

  increment() {
    store.dispatch({type: INCREMENT_COUNTER});
  }

  decrement() {
    store.dispatch({type: DECREMENT_COUNTER});
  }

}

export default new CounterActions();
