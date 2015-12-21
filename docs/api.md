# `electronEnhancer([params])`

Creates a store enhancer which registers a store to other electronEnhanced stores in other processes.  If created in a Renderer process (Either a `BrowserWindow` or a `webview`), dispatches are forwarded to the electronEnhanced store in the main process.  If an action is dispatched in the main process, the resulting change in state from that action is passed to all stores who's `filter` allows any of the changed state through.

### Arguments

The arguments to this function are passed in as an object of `argumentName: value`.

#### Renderer Process

 - `filter` (_Object|Function|true_): Describes exactly what data in the Store the current process requires.  See [README.md](https://github.com/samiskin/redux-electron-store/blob/master/README.md) for a proper description of the semantics.  If any change occurs to a property that passes the filter, the new value will be updated in the current process.  The default behavior allows any property.
 - `excludeUnfilteredState` (_Boolean_): Whether to have any properties __not__ passing the `filter` to be `undefined`, rather than being the default values described by the `reducer`.  This improves bug prevention at the cost of performance, since if a developer references a property in the store, they likely want that property to always be up to date.  Default is `false`.
 - `synchronous` (_Boolean_): Whether actions executed from the current process should be executed in the current process __and__ the main process, or immediately forward the action to the browser process, handle it there, and then have the resulting update be forwarded back to the current process asynchronously.  This option exists simply to allow the user to avoid doing the processing of actions twice, once in each process.  The downside is that the process of dispatching an action and having updated data is no longer synchronous.  Default is `true`.

#### Main Process

 - `persistState` (_Boolean|String_): If truthy, provides a `store.save()` method which saves the current state to a file.  If a string is passed as an argument, the file used will be the file at the provided path.  On initialization, the store will also attempt to load data from that file.
 - `persistFilter` (_Object|Function|true_): Describes what data in the store should be persisted.  Follows the same format as the Renderer `filter`.

#### Either Process

 - `preDispatchCallback` (_Function_): A function to be executed prior to any dispatch.
 - `postDispatchCallback` (_Function_): A function to be executed after any dispatch is made.

### Functions

#### Main Process

 - `save()`: When the persistState argument is truthy, this function backs up the data in the store that passes the `persistFilter`
