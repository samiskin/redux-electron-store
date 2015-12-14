
const GLOBAL_VARIABLE_NAME = '__electron-redux-store_global';

export default class ReduxElectronStore {

  constructor() {
    this.globalName = GLOBAL_VARIABLE_NAME;
    global[GLOBAL_VARIABLE_NAME] = this;
  }

  parseReducer(reducer) {
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
    return this.reduxStore.nextReducer(this.parseReducer(nextReducer));
  }

}

