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

import _ from 'lodash';

export default function fillShape(source, sink) {
  if (typeof sink === 'function') {
    sink = sink(source); //eslint-disable-line
  }

  if (sink === true) {
    return source;
  } else if (sink === undefined) {
    return undefined;
  }

  let filledObject = {};
  _.keys(sink).forEach((key) => {
    if (source[key] === undefined) {
      return;
    } else if (typeof sink[key] === 'object'
      || typeof sink[key] === 'function'
      || sink[key] === true) {
      filledObject[key] = fillShape(source[key], sink[key]);
    } else {
      throw new Error('Values in the sink must be another object, function, or `true`');
    }
  });
  return filledObject;
}
