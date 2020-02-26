# redux-electron-store
[![npm version](https://img.shields.io/npm/v/redux-electron-store.svg?style=flat-square)](https://www.npmjs.com/package/redux-electron-store)

> synchronize your redux state between main and renderer processes

This library solves the problem of synchronizing [Redux](https://github.com/rackt/redux/) stores in [Electron](https://github.com/atom/electron) apps. Electron is based on Chromium, and thus all Electron apps have a single [main process](https://github.com/atom/electron/blob/master/docs/tutorial/quick-start.md#differences-between-main-process-and-renderer-process) and (potentially) multiple renderer processes, one for each web page. `redux-electron-store` allows us to define a store per process, and uses [`ipc`](https://github.com/atom/electron/blob/master/docs/api/ipc-main.md) to keep them in sync.  It is implemented as a [redux store enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer).

This library __only__ works if the data in your store is __immutable__, as objects are compared by reference to determine changes.  The data being synchronized must also be pure JavaScript objects.

## Install

```bash
$ npm install redux-electron-store
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
    // See the options section
  })
);

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
let store = createStore(reducer, initialState, enhancer);
```

#### Renderer / Webview Process

```javascript
let enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({
    // See the options section
  }),
  DevTools.instrument()
);

let store = createStore(reducer, initialState, enhancer);
```

## How it works

#### Initialization
1. The main process creates its store
2. When a renderer is created, it copies the current state from the main process for its own initial state
3. The renderer then registers itself with the main process along with its "filter"

#### Runtime
1. An action occurs in either the renderer or the main process
2. If it was in a renderer, the action is run through the reducer and forwarded to the main process
3. The main process runs the action through the reducer
4. The main process compares its state prior to the reduction with the new state, and with reference checks (hence the need for immutable data), it determines what data in its store changed
5. The main process then iterates through each registered renderer. If the data that changed is described in that renderer's filter, the main process IPC's over an action with `data: { updated: {...}, deleted: {...} }` properties
6. The renderers that receive that action will then merge in that data, thereby staying in sync with the main process, while not repeating the processing done by the reduction

## API

### electronEnhancer(options?: Options)

Creates a store enhancer which registers a store to other electronEnhanced stores in other processes. If created in a Renderer process (Either a BrowserWindow or a webview), dispatches are forwarded to the electronEnhanced store in the main process. If an action is dispatched in the main process, the resulting change in state from that action is passed to all stores who's filter allows any of the changed state through.

### options

Type: `object`
```ts
export interface Options<T = Record<string, unknown>> {
  postDispatchCallback?: (action: AnyAction) => void;
  preDispatchCallback?: (action: AnyAction) => void;
  actionFilter?: (action: AnyAction) => boolean;
  dispatchProxy?: Dispatch;
  /*
  This property is only available for the renderer process
  */
  excludeUnfilteredState?: boolean;
  /*
  This property is only available for the renderer process
  */
  filter?: { [key in keyof T]?: boolean } | boolean;
}
```

#### filter
Type: `object | boolean`  
Default: `true`

In the renderer process, an important parameter that can improve performance is `filter`.  This `filter` is a way of describing exactly what data this renderer process wishes to be notified of. If a filter is provided, all updates which do not change a property which passes the filter will not be forwarded to the current renderer.

A filter can be an `object`, or `true/false`.

If the filter is `true` (which is default), the entire variable will pass through the filter.

If the filter is an `object`, its keys must be properties of the variable the filter is acting on, and its values are themselves filters which describe the value(s) of that property that will pass through the filter.

**Example Problem**:

>I am creating a Notifications window for Slack's application.  For this to work, I need to know the position to display the notifications, the notifications themselves, and the icons for each team to display as a thumbnail.  Any other data in my app has no bearing on this window, therefore it would be a waste for this window to have updates for any other data sent to it.

**Solution**:
```javascript
let filter = {
  notifications: true,
  settings: {
    notifyPosition: true
  }
};
```

#### postDispatchCallback
Type: `(action: AnyAction) => void;` 
 
A function to be executed after any dispatch is made.

#### preDispatchCallback
Type: `(action: AnyAction) => void;` 

A function to be executed prior to any dispatch.

#### actionFilter
Type: `(action: AnyAction) => boolean;` 
 
Allows filtering whether an action should be forwarded from this, to other processes or not.

#### dispatchProxy
Type: `(action: AnyAction) => void;` 
 
Allows actions from other processes to pass through other store enhancers such as redux-saga by exposing the final dispatch function of the store to the electronEnhancer. This would look like


## Hot Reloading Reducers


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

### License

MIT
