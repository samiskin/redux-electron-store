
const GLOBAL_VARIABLE_NAME = '__ELECTRON_REDUX_STORE__';

/**
 * Sets up a global accessor to this store and provides
 * the same API that Redux does.
*/
export default class ReduxElectronStore {

  constructor({preDispatchCallback, postDispatchCallback}) {
    // This global allows the Renderer to access the
    // browser process's store (to initialize its data)
    this.globalName = GLOBAL_VARIABLE_NAME;
    global[this.globalName] = this;
    this.preDispatchCallback = preDispatchCallback || (() => {});
    this.postDispatchCallback = postDispatchCallback || (() => {});
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
    this.preDispatchCallback(action);
    this.reduxStore.dispatch(action);
    this.postDispatchCallback(action);
  }

  subscribe(listener) {
    return this.reduxStore.subscribe(listener);
  }

  replaceReducer(nextReducer) {
    return this.reduxStore.nextReducer(this._parseReducer(nextReducer));
  }

}

