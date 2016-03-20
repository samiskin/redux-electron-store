const webpack = require('webpack');
const electronConfig = require('./webpack.config.electron');


const electronCompiler = webpack(electronConfig);

electronCompiler.watch(
  {
    aggregateTimeout: 300,
    poll: true
  }, function(err, stats) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(`Recompiled Electron files in ${stats.endTime - stats.startTime}ms`);
  }
);


const path = require('path');
const express = require('express');
const devConfig = require('./webpack.config.development');

const app = express();
const rendererCompiler = webpack(devConfig);

const PORT = 8080;

app.use(require('webpack-dev-middleware')(rendererCompiler, {
  publicPath: devConfig.output.publicPath,
  stats: {
    colors: true
  },
  noInfo: true
}));


app.use(require('webpack-hot-middleware')(rendererCompiler));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index-hot.html'));
});

app.listen(PORT, 'localhost', err => {
  if (err) {
    console.log(err);
    return;
  }

  console.log(`Listening at http://localhost:${PORT}`);
});
