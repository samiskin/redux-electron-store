// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import { ipcRenderer } from 'electron';
import * as url from 'url';

const store = require('./store');
const id = process.guestInstanceId || JSON.parse(url.parse(window.location.href, true).query.windowParams).id;
store.subscribe(() => ipcRenderer.send('renderer-store-update', id, store.getState()));

const button = document.createElement('button');
button.textContent = 'INCREMENT';
button.onclick = () => store.dispatch({type: 'INCREMENT', payload: 2});

document.body.appendChild(document.createElement('br'));
document.body.appendChild(document.createElement('br'));
document.body.appendChild(button);

store.subscribe(() => button.textContent = `INCREMENT ${store.getState().count}`);

if (!process.guestInstanceId) {
  const webview = document.getElementById('webview');
  webview.addEventListener('dom-ready', function listener() {
    webview.loadURL(`file://${__dirname + '/index.html'}`);
    webview.removeEventListener('dom-ready', listener);
  });
}
