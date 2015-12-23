import _ from 'lodash';
import Store from 'Store';

import { CLICK } from 'actions/AppActions';

class AppStore {

  getState() {
    return Store.getState().app;
  }

  reduce(state = {clickCount: 0}, action) {
    switch(action.type) {
    case CLICK:
      return _.assign({}, state, {clickCount: state.clickCount + 1});
    default:
      return state;
    }
  }
}

export default new AppStore();
