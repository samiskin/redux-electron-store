/*
  Takes the old and the new version of an immutable object and
  returns a hash of what has updated (added or changed) in the object
  and what has been deleted in the object (with the entry that has
  been deleted given a value of true).

  ex: objectDifference({a: 1}, {b: 2}) would return
    {updated: {b: 2}, deleted: {a: true}}
*/

import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import keys from 'lodash/keys';

const isShallow = val => Array.isArray(val) || !isObject(val);

export default function objectDifference(old, curr) {
  const updated = {};
  const deleted = {};

  keys(curr).forEach(key => {
    if (isShallow(curr[key]) || isShallow(old[key])) {
      updated[key] = curr[key];
    } else {
      const diff = objectDifference(old[key], curr[key]);
      !isEmpty(diff.updated) && (updated[key] = diff.updated);
      !isEmpty(diff.deleted) && (deleted[key] = diff.deleted);
    }
  });

  keys(old)
    .forEach(key => curr[key] === undefined && (deleted[key] = true));

  return { updated, deleted }
}
