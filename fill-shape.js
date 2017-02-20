/*
Source: The source of the data, containing all the information to fill the filter with
filter: The shape of the data to be filled, describing the desired objects by giving
      each desired key a value of true

Returns: An object with the same shape as the filter, filled with values from the source
Ex:
Source: {                              filter {
  teams: {                              teams: {
    '1': {                                '1': {
      name: 'The A Team',                   name: true
      rating: 5                           },
    },                                    '2': true
    '2': {                              }
      name: 'The B Team',             }
      rating: 3
}}}

Will return:
{
  teams: {
    '1': { name: 'The A Team' }
    '2': { name: 'The A Team', rating: 3 }
  }
}
*/

import keys from 'lodash/keys';


export default function fillShape(source, filter) {
  if (typeof filter === 'function') {
    filter = filter(source); //eslint-disable-line
  }

  if (filter === true) {
    return source;
  } else if (filter === undefined) {
    return undefined;
  }

  let filledObject = {};
  keys(filter).forEach((key) => {
    if (source[key] === undefined) {
      return;
    } else if (typeof filter[key] === 'object'
      || typeof filter[key] === 'function'
      || filter[key] === true) {
      filledObject[key] = fillShape(source[key], filter[key]);
    } else {
      throw new Error('Values in the filter must be another object, function, or `true`');
    }
  });
  return filledObject;
}
