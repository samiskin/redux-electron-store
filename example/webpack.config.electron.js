const _ = require('lodash');
const webpack = require('webpack');

const baseConfig = require('./webpack.config.base');

const config = _.cloneDeep(baseConfig);


// const fs = require('fs');
// var nodeModules = {};
// fs.readdirSync('node_modules')
//   .filter(function(x) {
//     return ['.bin'].indexOf(x) === -1;
//   })
//   .forEach(function(mod) {
//     nodeModules[mod] = 'commonjs ' + mod;
//   });
// config.externals.push(nodeModules);


config.devtool = 'cheap-module-eval-source-map';
config.output.filename = 'main.js';
config.target = 'atom';
config.entry = './main.js';
config.devtool = 'sourcemap';
config.plugins.push(
  new webpack.BannerPlugin('require("source-map-support").install();',
    { raw: true, entryOnly: false })
);
config.externals.push('electron');


module.exports = config;
