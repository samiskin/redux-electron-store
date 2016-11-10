import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';

/**
 * Determines if an object is, or contains, an Electron remote object.
 * Under the surface, getting or setting properties on remote objects triggers
 * synchronous IPC messages. So we want to avoid storing them at all costs.
 *
 * Refer to https://github.com/electron/electron/blob/master/docs/api/remote.md#remote-objects.
 *
 * @param  {Object} obj An object to test
 * @return {Boolean}    True if it is a remote object, false otherwise
 */
export function containsRemoteObject(obj) {
  if (!process || !process.atomBinding) return false;
  if (!isObject(obj) && !isFunction(obj)) return false;

  const v8util = process.atomBinding('v8_util');
  if (v8util.getHiddenValue(obj, 'atomId')) return true;

  return Object.keys(obj).find((x) => containsRemoteObject(obj[x]));
}
