let storeEnhancer = null;
if (process.type === 'browser') {
  storeEnhancer = require('./electronBrowserEnhancer').default;
} else {
  storeEnhancer = require('./renderer-enhancer').default;
}

module.exports = {
  electronEnhancer: storeEnhancer
};
