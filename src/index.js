let store = null;
if (process.type === 'browser') {
  store = require('./redux-browser-store').default;
} else {
  store = require('./redux-renderer-store').default;
}

export default store;
