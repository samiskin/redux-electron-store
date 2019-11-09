import keys from 'lodash/keys';
import { isShallow } from './object-difference';


export function objectMerge(a: any, b: any) {
  if (a === b || isShallow(a) || isShallow(b)) {
    return b !== undefined ? b : a;
  }
  let merged: any = {};
  keys(a).forEach(key => merged[key] = objectMerge(a[key], b[key]));
  keys(b).forEach(key => a[key] === undefined && (merged[key] = b[key]));
  return merged;
};
