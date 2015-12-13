export default class ReduxElectronStore {

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

