let storeEnhancer = null;
if (process.type === 'browser') {
  storeEnhancer = require('./electronBrowserEnhancer').default;
} else {
  storeEnhancer = require('./electronRendererEnhancer').default;
}

module.exports = {
  electronEnhancer: storeEnhancer
};
