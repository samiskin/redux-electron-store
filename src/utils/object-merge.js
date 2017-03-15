const isObject = require('lodash/isObject');
const keys = require('lodash/keys');

const isShallow = (val) => Array.isArray(val) || !isObject(val);

module.exports = function objectMerge(a, b) {
  if (a === b || isShallow(a) || isShallow(b)) {
    return b !== undefined ? b : a;
  }
  let merged = {};
  keys(a).forEach(key => merged[key] = objectMerge(a[key], b[key]));
  keys(b).forEach(key => a[key] === undefined && (merged[key] = b[key]));
  return merged;
};
