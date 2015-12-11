'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = objectDifference;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
  Takes the old and the new version of an immutable object and
  returns a hash of what has updated (added or changed) in the object
  and what has been deleted in the object (with the entry that has
  been deleted given a value of true).

  ex: objectDifference({a: 1}, {b: 2}) would return
    {updated: {b: 2}, deleted: {a: true}}
*/

function objectDifference(oldValue, newValue) {

  var updated = {};
  var deleted = {};

  _lodash2.default.keys(newValue).forEach(function (key) {
    if (oldValue[key] === newValue[key]) return;

    // If there is a difference in the variables, check if they are an actual
    // javascript object (not an array, which typeof says is object).  If they
    // are an object, check for differences in the objects and update our
    // diffs if there is anything there.  If it isn't an object, then it is either
    // a changed value or a new value, therefore add it to the updated object
    if (_lodash2.default.isObject(oldValue[key]) && _lodash2.default.isObject(newValue[key]) && !Array.isArray(oldValue[key]) && !Array.isArray(newValue[key])) {
      var deep = objectDifference(oldValue[key], newValue[key]);
      if (!_lodash2.default.isEmpty(deep.updated)) updated[key] = deep.updated;
      if (!_lodash2.default.isEmpty(deep.deleted)) deleted[key] = deep.deleted;
    } else {
      updated[key] = newValue[key];
    }
  });

  // Any keys in the old object that aren't in the new one must have been deleted
  _lodash2.default.keys(oldValue).forEach(function (key) {
    if (newValue[key] !== undefined) return;
    deleted[key] = true;
  });

  return { updated: updated, deleted: deleted };
}