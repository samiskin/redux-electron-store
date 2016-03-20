'use strict';

const webpack = require('webpack');
const webpackTargetElectronRenderer = require('webpack-target-electron-renderer');
const baseConfig = require('./webpack.config.base');
const autoprefixer = require('autoprefixer');
const precss = require('precss');
const postcssImport = require('postcss-import');

const config = Object.create(baseConfig);

config.debug = true;

config.devtool = 'cheap-module-eval-source-map';

config.entry = [
  'webpack-hot-middleware/client?path=http://localhost:8080/__webpack_hmr',
  './src/renderer/index'
];
config.output.publicPath = 'http://localhost:8080/build/';


config.postcss = function(webpackDependency) {
  return [
    postcssImport({
      addDependencyTo: webpackDependency,
      path: '/'
    }),
    autoprefixer,
    precss
  ];
},

config.module.loaders.push(
  {test: /\.json$/, loaders: ['json-loader']},
  {test: /\.css$/, loaders: ['style', 'css?modules&sourceMap&localIdentName=[name]-[local]-[hash:base64:5]!', 'postcss']}
);

config.plugins.push(
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    '__DEV__': true,
    'process.env': {
      'NODE_ENV': JSON.stringify('development')
    }
  })
);

config.target = webpackTargetElectronRenderer(config);

module.exports = config;

