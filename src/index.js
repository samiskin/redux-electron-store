let storeEnhancer = null;
if (process.type === 'browser') {
  storeEnhancer = require('./main-enhancer');
} else {
  storeEnhancer = require('./renderer-enhancer');
}

module.exports = {
  electronEnhancer: storeEnhancer
};
