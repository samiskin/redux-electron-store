
const GLOBAL_VARIABLE_NAME = '__ELECTRON_REDUX_STORE__';

export default class ReduxElectronStore {

  constructor() {
    this.globalName = GLOBAL_VARIABLE_NAME;
    global[this.globalName] = this;
  }

  _parseReducer(reducer) {
    return reducer;
  }

  getReduxStore() {
    return this.reduxStore;
  }

  getState() {
    return this.reduxStore.getState();
  }

  dispatch(action) {
    return this.reduxStore.dispatch(action);
  }

  subscribe(listener) {
    return this.reduxStore.subscribe(listener);
  }

  replaceReducer(nextReducer) {
    return this.reduxStore.nextReducer(this._parseReducer(nextReducer));
  }

}

