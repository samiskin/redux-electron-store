'use strict';

const path = require('path');

module.exports = {
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    root: path.join(__dirname, 'src'),
    modulesDirectories: ['node_modules', 'components', 'browser', 'browser/components', 'lib', 'renderer', 'renderer/components'],
    extensions: ['', '.js', '.jsx'],
    packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']
  },
  plugins: [
  ],
  externals: [
  ],
  module: {
    loaders: [
      {test: /\.jsx?$/, loaders: ['babel?breakConfig'], exclude: /node_modules/}
    ]
  }
};
