import Store from 'Store';

export const INCREMENT_COUNTER = 'INCREMENT_COUNTER'; // Symbol('CLICK');
export const DECREMENT_COUNTER = 'DECREMENT_COUNTER';
export const CHANGE_WORD = 'CHANGE_WORD';

class Actions {

  increment() {
    Store.dispatch({type: INCREMENT_COUNTER});
  }

  decrement() {
    Store.dispatch({type: DECREMENT_COUNTER});
  }

  changeWord(newWord) {
    Store.dispatch({type: CHANGE_WORD, data: newWord});
  }

}

export default new Actions();
