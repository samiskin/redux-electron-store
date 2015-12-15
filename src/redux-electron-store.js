
const GLOBAL_VARIABLE_NAME = '__ELECTRON_REDUX_STORE__';

/**
 * Sets up a global accessor to this store and provides
 * the same API that Redux does.
*/
export default class ReduxElectronStore {

  constructor() {
    // This global allows the Renderer to access the
    // browser process's store (to initialize its data)
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

