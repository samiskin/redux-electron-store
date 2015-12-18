import _ from 'lodash';
import fillShape from './utils/fill-shape';
import objectDifference from './utils/object-difference.js';

let globalName = '__REDUX_ELECTRON_STORE__';

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 * @param {Object} p - The parameters to the creator
 * @param {Function} p.postDispatchCallback - A callback to run after a dispatch has occurred.
 * @param {Function} p.preDispatchCallback - A callback to run before an action is dispatched.
*/
export default function electronBrowserEnhancer({
  postDispatchCallback: postDispatchCallback = (() => null),
  preDispatchCallback: preDispatchCallback = (() => null)
}) {
  return (storeCreator) => {
    return (reducer, initialState) => {
      let { ipcMain } = require('electron');

      let store = storeCreator(reducer, initialState);
      global[globalName] = store;

      let renderers = {};
      let filters = {};

      // TODO: Clean this up to something more clear.  The reason this is necessary
      // is becasue when a BrowserWindow is refreshed, new webContents are made but
      // the old ones also persist, so actions get dispatched multiple times.
      let windowIdsToContentsIds = {};

      let unregisterRenderer = (webContentsId) => {
        delete renderers[webContentsId];
        delete filters[webContentsId];
      };

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
            unregisterRenderer(webContentsId);
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
      };

      return store;
    };
  };
}

