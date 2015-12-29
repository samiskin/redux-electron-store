import { compose, createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { fluxEnhancer } from 'redux-flux-store';

import AppStore from 'stores/AppStore';

let logger = createLogger({
  level: 'info',
  duration: true
});

let finalCreateStore = compose(
  fluxEnhancer({
    app: AppStore
  }),
  applyMiddleware(thunk, logger)
);

if (process.type === 'renderer' && !process.guestInstanceId) {
  finalCreateStore = compose(
    finalCreateStore,
    require('DevTools').instrument()
  );
}

let store = finalCreateStore(createStore)(() => {});

export default store;

