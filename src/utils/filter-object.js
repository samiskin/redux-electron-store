import { isObject } from './lodash-clones';
// Given an source object and a filter shape, remove all leaf elements in the shape
// from the source.  Example:
// filterObject({'a': 1, 'b':{'c': {}}}, {'b': {'c': true}})
//   will return {'a': 1, 'b': {}}.
// The value of the leaf elment has to be true to be ignored
// (To ensure all uses of this function look the same)
export default function filterObject(source, filter) {
  if (!source || filter === true) return {};
  let filtered = {};
  Object.keys(source).forEach((key) => {
    if (isObject(filter[key])) {
      filtered[key] = filterObject(source[key], filter[key]);
    } else if (filter[key] && filter[key] !== true) {
      throw new Error(`Values in the filter must either be another object or 'true' \n Filter given: ${JSON.stringify(filter)}`);
    } else if (filter[key] !== true) {
      filtered[key] = source[key];
    }
  });
  return filtered;
}
