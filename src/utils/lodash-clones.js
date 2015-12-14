function isEmpty(variable) {
  return variable === null
    || variable === undefined
    || (typeof variable === 'object'
        && !Array.isArray(variable)
        && Object.keys(variable).length === 0);
}

function isObject(variable) {
  return typeof(variable) === 'object' && !Array.isArray(variable);
}


export {
  isEmpty,
  isObject
}
