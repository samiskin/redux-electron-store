import _ from 'lodash';
import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';
import ReduxElectronStore from './redux-electron-store';

let globalName = '__REDUX_ELECTRON_STORE__';

export default function electronBrowserEnhancer(params) {

  let {postDispatchCallback, preDispatchCallback} = params;
  postDispatchCallback = postDispatchCallback || (() => null);
  preDispatchCallback = preDispatchCallback || (() => null);


  return (storeCreator) => {
    return (reducer, initialState) => {
      let { ipcMain } = require('electron');

      let store = storeCreator(reducer, initialState);
      global[globalName] = store;

      let renderers = {};
      let filters = {};

      // TODO: Clean this up
      let windowIdsToContentsIds = {};

      let unregisterRenderer = (webContentsId) => {
        delete renderers[webContentsId];
        delete filters[webContentsId];
      }

      ipcMain.on(`${globalName}-renderer-dispatch`, (event, action) => {
        store.dispatch(action);
      });

      ipcMain.on(`${globalName}-register-renderer`, ({sender}, {filter}) => {
        let webContentsId = sender.getId();
        renderers[webContentsId] = sender;
        filters[webContentsId] = filter;

        if (!sender.isGuest()) { // For windows (not webviews)
          let browserWindow = sender.getOwnerBrowserWindow();

          // TODO: Clean this up
          if (windowIdsToContentsIds[browserWindow.id] !== undefined) {
            unregisterRenderer(windowIdsToContentsIds[browserWindow.id]);
          }
          windowIdsToContentsIds[browserWindow.id] = webContentsId;

          // BrowserWindows closing don't seem to destroy the webContents
          browserWindow.on('closed', () => unregisterRenderer(webContentsId));
        }
      });


      let oldDispatchMethod = store.dispatch;

      store.dispatch = (action) => {
        action.source = action.source || 'browser';

        let prevState = store.getState();
        preDispatchCallback(action);
        oldDispatchMethod(action);
        postDispatchCallback(action);
        let newState = store.getState();
        let stateDifference = objectDifference(prevState, newState);

        for (let webContentsId in renderers) {

          let webContents = renderers[webContentsId];

          if (webContents.isDestroyed() || webContents.isCrashed()) {
            unregisterRenderer();
            return;
          }

          let shape = filters[webContentsId];
          let updated = fillShape(stateDifference.updated, shape);
          let deleted = fillShape(stateDifference.deleted, shape);

          // If any data the renderer is watching changes, send an ipc
          // call to inform it of the updated and deleted data
          if (!_.isEmpty(updated) || !_.isEmpty(deleted)) {
            let payload = Object.assign({}, action, { data: {updated, deleted} });
            webContents.send(`${globalName}-browser-dispatch`, payload);
          }
        }
      }

      return store;
    }
  }
}

