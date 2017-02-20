// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer } = require('electron');

const store = require('./store');

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
