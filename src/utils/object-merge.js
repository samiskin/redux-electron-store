const isObject = require('lodash/isObject');
const isEmpty = require('lodash/isEmpty');

module.exports = function objectMerge(objA, objB) {
  let merged = {};
  keys(objA).forEach((key) => {
    let a = objA[key];
    let b = objB[key];

    if (a === b) {
      merged[key] = a;
    } else if (!Array.isArray(a) && !Array.isArray(b) && isObject(a) && isObject(b)) {
      merged[key] = objectMerge(a, b);
    } else {
      merged[key] = b !== undefined ? b : a; // default to b if it exists
    }
  });

  keys(objB).forEach((key) => {
    if (objA[key] === undefined) { // fill in the rest
      merged[key] = objB[key];
    }
  });

  return merged;
}
