# redux-electron-store
[![npm version](https://img.shields.io/npm/v/redux-electron-store.svg?style=flat-square)](https://www.npmjs.com/package/redux-electron-store)
[![npm downloads](https://img.shields.io/npm/dm/redux-electron-store.svg?style=flat-square)](https://www.npmjs.com/package/redux-electron-store)

This library solves the problem of synchronizing [Redux](https://github.com/rackt/redux/) stores in [Electron](https://github.com/atom/electron) apps. Electron is based on Chromium, and thus all Electron apps have a single [main process](https://github.com/atom/electron/blob/master/docs/tutorial/quick-start.md#differences-between-main-process-and-renderer-process) and (potentially) multiple renderer processes, one for each web page. `redux-electron-store` allows us to define a store per process, and uses [`ipc`](https://github.com/atom/electron/blob/master/docs/api/ipc-main.md) to keep them in sync in an efficient manner.  It is implemented as a [redux store enhancer](https://github.com/rackt/redux/blob/master/docs/Glossary.md#store-enhancer).

## Installation
```bash
npm i redux-electron-store
```

## Usage

#### Main Process


```javascript
import { electronEnhancer } from 'redux-electron-store';

let finalCreateStore = compose(
  applyMiddleware(...middleware),
  electronEnhancer({
    persistState: true,
    persistShape: { settings: true } // A filter (see below)
  })
)(createStore);

let store = finalCreateStore(reducer); // Initial state will be loaded from file

store.save(); // Saves the settings to a default JSON file
```


#### Renderer / Webview Process

In the renderer process, the store takes the same `createStore` and `reducer` properties, however it can also take a `filter`.  `filter` is a way of describing exactly what data this renderer process wishes to be notified of.

```javascript
let filter = {
  notifications: true,
  settings: true
};

let finalCreateStore = compose(
  applyMiddleware(...middleware),
  electronEnhancer({filter}),
  DevTools.instrument()
)(createStore);
```

##### Filters

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
## TODOs

1. Add the functionality to persist state across application executions.
1. Formalize and implement unit testing
1. Create working Electron App to serve as a complete example
