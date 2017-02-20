const { createStore } = require('redux');
const { electronEnhancer } = require('../src');

const counter = (state, action) => {
  return action.type === 'INCREMENT' ? {count: state.count + action.payload} : state;
}

let store = createStore(counter, {count: 0}, electronEnhancer());
store.subscribe(() => console.log(store.getState()));

global.store = store;
module.exports = store;
