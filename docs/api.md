# `electronEnhancer([params])`

Creates a store enhancer which registers a store to other electronEnhanced stores in other processes.  If created in a Renderer process (Either a `BrowserWindow` or a `webview`), dispatches are forwarded to the electronEnhanced store in the main process.  If an action is dispatched in the main process, the resulting change in state from that action is passed to all stores who's `filter` allows any of the changed state through.

### Arguments

The arguments to this function are passed in as an object of `argumentName: value`.

#### Renderer Process

 - `filter` (_Object|Function|true_): Describes exactly what data in the Store the current process requires.  See [README.md](https://github.com/samiskin/redux-electron-store/blob/master/README.md) for a proper description of the semantics.  If any change occurs to a property that passes the filter, the new value will be updated in the current process.  The default behavior allows any property.
  - `excludeUnfilteredState` (_Boolean_): Whether to have any properties __not__ passing the `filter` to be `undefined`, rather than being the default values described by the `reducer`.  This improves bug prevention at the cost of performance, since if a developer references a property in the store, they likely want that property to always be up to date.  Default is `false`.

#### Either Process

 - `preDispatchCallback` (_Function_): A function to be executed prior to any dispatch.
 - `postDispatchCallback` (_Function_): A function to be executed after any dispatch is made.
 - `dispatchProxy` (_Function_): Allows actions from other processes to pass through other store enhancers such as `redux-saga` by exposing the final dispatch function of the store to the `electronEnhancer`.  This would look like `dispatchProxy: a => store.dispatch(a)`, where `store` is the result of `createStore`.
 - `actionFilter` (_Function_): Allows filtering whether an action should be forwarded to other processes or not
