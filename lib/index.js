'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var store = process.type === 'browser' ? require('./redux-browser-store').default : require('./redux-renderer-store').default;
exports.default = store;