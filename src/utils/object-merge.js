import _ from 'lodash';

export default function objectMerge(objA, objB) {
  let merged = {};
  _.keys(objA).forEach((key) => {
    let a = objA[key];
    let b = objB[key];

    if (a === b){
      merged[key] = a;
    } else if (!_.isArray(a) && !_.isArray(b) && _.isObject(a) && _.isObject(b)) {
      merged[key] = objectMerge(a, b);
    } else {
      merged[key] = b !== undefined ? b : a; // default to b if it exists
    }
  });

  _.keys(objB).forEach((key) => {
    if (objA[key] === undefined) // fill in the rest
      merged[key] = objB[key];
  });

  return merged;
}
