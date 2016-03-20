
'use strict';
import app from 'app';
import BrowserWindow from 'browser-window';
import Application from 'browser/application';
import crashReporter from 'crash-reporter';

require('electron-debug')();
 crashReporter.start();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('ready', function() {
  const application = new Application();
});
