/*
Source: The source of the data, containing all the information to fill the sink with
Sink: The shape of the data to be filled, describing the desired objects by giving
      each desired key a value of true

Returns: An object with the same shape as the sink, filled with values from the source
Ex:
Source: {                              Sink {
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

import isEmpty from 'lodash.isempty';

export default function fillShape(source, sink) {

  if (typeof sink === 'function') {
    sink = sink(source);
  }

  if (sink === true) {
    return source;
  }

  let filledObject = Array.isArray(source) ? [] : {};
  Object.keys(sink).forEach((key) => {
    if (source[key] === undefined) {
      return;
    } else if (typeof sink[key] === 'object'
      || typeof sink[key] === 'function'
      || sink[key] === true) {
      let filledChildren = fillShape(source[key], sink[key]);
      if (filledChildren && (typeof filledChildren !== 'object' || !isEmpty(filledChildren))) {
        filledObject[key] = filledChildren;
      }
    } else {
      throw new Error('Values in the sink must be another object, function, or `true`');
    }
  });
  return filledObject;
}
