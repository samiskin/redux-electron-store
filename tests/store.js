const { createStore } = require('redux');
const { electronEnhancer } = require('../src');

const counter = (state, action) => {
  return action.type === 'INCREMENT' ? {count: state.count + action.payload} : state;
}

const opts = {}
if (process.type === 'renderer') {
  const url = require('url');
  if (window.rendererId === 1)
    opts.filter = { counter: true }
}


let store = createStore(counter, {count: 0}, electronEnhancer(opts));
store.subscribe(() => console.log(store.getState()));

global.store = store;
module.exports = store;
