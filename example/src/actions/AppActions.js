import Dispatcher from 'Dispatcher';

export const CLICK = 'CLICK'; // Symbol('CLICK');

class AppActions {

  click() {
    Dispatcher.dispatch({type: CLICK});
  }

}

export default new AppActions();
