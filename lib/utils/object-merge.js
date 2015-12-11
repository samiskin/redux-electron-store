'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = objectMerge;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function objectMerge(objA, objB) {
  var merged = {};
  _lodash2.default.keys(objA).forEach(function (key) {
    var a = objA[key];
    var b = objB[key];

    if (a === b) {
      merged[key] = a;
    } else if (!_lodash2.default.isArray(a) && !_lodash2.default.isArray(b) && _lodash2.default.isObject(a) && _lodash2.default.isObject(b)) {
      merged[key] = objectMerge(a, b);
    } else {
      merged[key] = b !== undefined ? b : a; // default to b if it exists
    }
  });

  _lodash2.default.keys(objB).forEach(function (key) {
    if (objA[key] === undefined) // fill in the rest
      merged[key] = objB[key];
  });

  return merged;
}