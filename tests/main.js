
const {app, ipcMain, BrowserWindow} = require('electron');
const url = require('url');
const path = require('path');
const test = require('tape');
const colorize = require('tap-colorize');

const loadFileUrl = (wnd, params = {}) => {
  let targetUrl = url.format({
    protocol: 'file',
    pathname: require.resolve('./index.html'),
    slashes: true,
    query: {windowParams: JSON.stringify(params)}
  });

  wnd.loadURL(targetUrl);
}

app.on('ready', () => {

  test.createStream().pipe(colorize({pass: 'green', info: 'brightblack', fail: 'red'})).pipe(process.stdout);

  const testUndefined = new Promise((resolve) => {
    test('renderer errors with message if uninitialized in main', (t) => {
      console.log('testing');
      ipcMain.once('renderer-error', (e, msg) => {
        t.assert(msg.startsWith('redux-electron-store:'));
        t.end();
        win.close();
        resolve();
      });
      const win = new BrowserWindow({show: false});
      loadFileUrl(win, {id: 0});
    });
  });

  testUndefined.then(() => {
    const store = require('./store');
  });

  // const numWindows = 3;
  // const padding = 10;
  // const windowSize = {width: 500, height: 500};

  // const { screen } = require('electron'); // electron.screen is only available afetr 'ready'
  // const screenSize = screen.getPrimaryDisplay().size;
  // const top = 0.5 * screenSize.height - windowSize.height; // Vertical centering
  // const left = 0.5 * (screenSize.width - (numWindows * (padding + windowSize.width) - padding)); // Horizontal centering

  // // Create the browser window.
  // const windows = Array(numWindows).fill().map((_, index) => {
  //   const win = new BrowserWindow({
  //     width: windowSize.width,
  //     height: windowSize.height,
  //     x: left + (windowSize.width + padding) * index,
  //     y: top,
  //     show: true,
  //   });
  //   loadFileUrl(win, {id: index});
  //   return win;
  // });

});
