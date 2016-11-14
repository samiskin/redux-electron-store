# redux-electron-store
[![npm version](https://img.shields.io/npm/v/redux-electron-store.svg?style=flat-square)](https://www.npmjs.com/package/redux-electron-store)

This library solves the problem of synchronizing [Redux](https://github.com/rackt/redux/) stores in [Electron](https://github.com/atom/electron) apps. Electron is based on Chromium, and thus all Electron apps have a single [main process](https://github.com/atom/electron/blob/master/docs/tutorial/quick-start.md#differences-between-main-process-and-renderer-process) and (potentially) multiple renderer processes, one for each web page. `redux-electron-store` allows us to define a store per process, and uses [`ipc`](https://github.com/atom/electron/blob/master/docs/api/ipc-main.md) to keep them in sync in an efficient manner.  It is implemented as a [redux store enhancer](https://github.com/rackt/redux/blob/master/docs/Glossary.md#store-enhancer).

This library __only__ works if the data in your store is __immutable__, as objects are compared by reference to determine changes.

## Installation

```bash
npm i redux-electron-store
```

## Usage

#### Main Process


```javascript
import { createStore, applyMiddleware, compose } from 'redux';
import { electronEnhancer } from 'redux-electron-store';

let enhancer = compose(
  applyMiddleware(...middleware),
  // Must be placed after any enhancers which dispatch
  // their own actions such as redux-thunk or redux-saga
  electronEnhancer({
    // Allows synched actions to pass through all enhancers
    dispatchProxy: a => store.dispatch(a),
  })
);

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
let store = createStore(reducer, initialState, enhancer);
```

#### Renderer / Webview Process

In the renderer process, the store will handle a `filter` property in its parameter.  `filter` is a way of describing exactly what data this renderer process wishes to be notified of.  If a filter is provided, all updates which do not change a property which passes the filter will not be forwarded to the current renderer.



```javascript
let filter = {
  notifications: true,
  settings: true
};

let enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({
    filter,
    dispatchProxy: a => store.dispatch(a),
  }),
  DevTools.instrument()
);

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
let store = createStore(reducer, initialState, enhancer);
```

#### Filters

A filter can be an `object`, a `function`, or `true`.

If the filter is `true`, the entire variable will pass through the filter.

If the filter is a `function`, the function will be called with the variable the filter is acting on as a parameter, and the return value of the function must itself be a filter (either an `object` or `true`)

If the filter is an `object`, its keys must be properties of the variable the filter is acting on, and its values are themselves filters which describe the value(s) of that property that will pass through the filter.

**Example Problem**:

>I am creating a Notifications window for Slack's application.  For this to work, I need to know the position to display the notifications, the notifications themselves, and the icons for each team to display as a thumbnail.  Any other data in my app has no bearing on this window, therefore it would be a waste for this window to have updates for any other data sent to it.

**Solution**:
```javascript
// Note: The Lodash library is being used here as _
let filter = {
  notifications: true,
  settings: {
    notifyPosition: true
  },
  teams: (teams) => {
    return _.mapValues(teams, (team) => {
      return {icons: true};
    });
  }
};
```

More options are documented in the [api docs](https://github.com/samiskin/redux-electron-store/blob/master/docs/api.md), and a description of exactly how this library works is on the way.  

#### Hot Reloading Reducers


Hot reloading of reducers needs to be done on both the renderer and the main process.  Doing this requires two things:

- The renderer needs to inform the main process when it has reloaded
  ```js
  // In the renderer process
  if (module.hot) {
    module.hot.accept('../reducers', () => {
      ipc.sendSync('renderer-reload');
      store.replaceReducer(require('../reducers'))
    });
  }
  ```

- The main process needs to delete its cached `reducers` data
  ```js
  // In the main process
  ipcMain.on('renderer-reload', (event, action) => {
    delete require.cache[require.resolve('../reducers')];
    store.replaceReducer(require('../reducers'));
    event.returnValue = true;
  });
  ```
  - Note: Individual reducer files may also need to be deleted from the cache if they have been required elsewhere in the application




## How it works

#### Initialization
1. The main process creates its store, then saves it into a global
2. When a renderer is created, it uses `remote.getGlobal` to get the main process's state, then copies it in for its own initial state
3. The renderer registers itself with the main process along with its "filter"

#### Runtime
1. An action occurs in either the renderer or the main process
2. If it was in a renderer, the action is run through the reducer and forwarded to the main process
3. The main process runs the action through the reducer
4. The main process compares its state prior to the reduction with the new state, and with reference checks (hence the need for immutable data), it determines what data in its store changed
5. The main process then iterates through each registered renderer. If the data that changed is described in that renderer's filter, the main process IPC's over an action with `data: { updated: {...}, deleted: {...} }` properties
6. The renderers that receive that action will then merge in that data, thereby staying in sync with the main process, while not repeating the processing done by the reduction

### License

MIT
