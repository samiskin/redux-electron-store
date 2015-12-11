const store = process.type === 'browser' ? require('./redux-browser-store').default : require('./redux-renderer-store').default;
export default store;
