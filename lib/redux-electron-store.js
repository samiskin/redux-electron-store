'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var isEmpty = _interopDefault(require('lodash/isEmpty'));
var keys = _interopDefault(require('lodash/keys'));
var isObject = _interopDefault(require('lodash/isObject'));

var Message;
(function (Message) {
    Message["RegisterRenderer"] = "@@REDUX_ELECTRON_STORE/register-renderer";
    Message["BrowserDispatch"] = "@@REDUX_ELECTRON_STORE/browser-dispatch";
    Message["RendererDispatch"] = "@@REDUX_ELECTRON_STORE/renderer-dispatch";
})(Message || (Message = {}));
var Global;
(function (Global) {
    Global["InitialState"] = "__REDUX_ELECTRON_STORE__InitialState";
})(Global || (Global = {}));

/*
  Source: The source of the data, containing all the information to fill the sink with
  Sink: The shape of the data to be filled, describing the desired objects by giving
        each desired key a value of true

  Returns: An object with the same shape as the sink, filled with values from the source
  Ex:
  Source: {                              Sink {
    teams: {                              teams: {
      '1': {                                '1': {
        name: 'The A Team',                   name: true
        rating: 5                           },
      },                                    '2': true
      '2': {                              }
        name: 'The B Team',             }
        rating: 3
  }}}

  Will return:
  {
    teams: {
      '1': { name: 'The A Team' }
      '2': { name: 'The A Team', rating: 3 }
    }
  }
*/
function fillShape(source, sink) {
    if (typeof sink === 'function') {
        sink = sink(source); //eslint-disable-line
    }
    if (sink === true) {
        return source;
    }
    else if (sink === undefined) {
        return undefined;
    }
    var filledObject = {};
    keys(sink).forEach(function (key) {
        if (source[key] === undefined) {
            return;
        }
        else if (typeof sink[key] === 'object'
            || typeof sink[key] === 'function'
            || sink[key] === true) {
            filledObject[key] = fillShape(source[key], sink[key]);
        }
        else {
            throw new Error('Values in the sink must be another object, function, or `true`');
        }
    });
    return filledObject;
}

/*
  Given an source object and a filter shape, remove all leaf elements in the shape
  from the source.

  Example:
  filterObject({'a': 1, 'b':{'c': {}}}, {'b': {'c': true}})
  will return {'a': 1, 'b': {}}.

  The value of the leaf elment has to be true to be ignored
*/
function filterObject(source, filter) {
    if (!source || filter === true)
        return {};
    var filtered = {};
    if (isFilterObject(filter)) {
        keys(source).forEach(function (key) {
            if (isObject(filter[key])) {
                filtered[key] = filterObject(source[key], filter[key]);
            }
            else if (filter[key] && filter[key] !== true) {
                throw new Error("Values in the filter must either be another object or 'true' \n Filter given: " + JSON.stringify(filter));
            }
            else if (filter[key] !== true) {
                filtered[key] = source[key];
            }
        });
    }
    return filtered;
}
var isFilterObject = function (o) { return isObject(o); };

/*
  Takes the old and the new version of an immutable object and
  returns a hash of what has updated (added or changed) in the object
  and what has been deleted in the object (with the entry that has
  been deleted given a value of true).

  ex: objectDifference({a: 1}, {b: 2}) would return
    {updated: {b: 2}, deleted: {a: true}}
*/
var isShallow = function (val) { return Array.isArray(val) || !isObject(val); };
function objectDifference(old, curr) {
    var updated = {};
    var deleted = {};
    keys(curr).forEach(function (key) {
        if (old[key] === curr[key])
            return;
        if (isShallow(curr[key]) || isShallow(old[key])) {
            updated[key] = curr[key];
        }
        else {
            var diff = objectDifference(old[key], curr[key]);
            !isEmpty(diff.updated) && (updated[key] = diff.updated);
            !isEmpty(diff.deleted) && (deleted[key] = diff.deleted);
        }
    });
    keys(old).forEach(function (key) { return curr[key] === undefined && (deleted[key] = true); });
    return { updated: updated, deleted: deleted };
}

function objectMerge(a, b) {
    if (a === b || isShallow(a) || isShallow(b)) {
        return b !== undefined ? b : a;
    }
    var merged = {};
    keys(a).forEach(function (key) { return merged[key] = objectMerge(a[key], b[key]); });
    keys(b).forEach(function (key) { return a[key] === undefined && (merged[key] = b[key]); });
    return merged;
}

function getSubscribeFuncs() {
    var currentListeners = [];
    var nextListeners = currentListeners;
    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            nextListeners = currentListeners.slice();
        }
    }
    return {
        subscribe: function (flags, listener) {
            if (typeof listener !== 'function') {
                throw new Error('Expected listener to be a function.');
            }
            if (flags.isDispatching) {
                throw new Error('You may not call store.subscribe() while a reducer is executing');
            }
            var isSubscribed = true;
            ensureCanMutateNextListeners();
            nextListeners.push(listener);
            return function unsubscribe() {
                if (!isSubscribed)
                    return;
                if (flags.isDispatching) {
                    throw new Error('You may not unsubscribe from a store listener while the reducer is executing');
                }
                isSubscribed = false;
                ensureCanMutateNextListeners();
                nextListeners.splice(nextListeners.indexOf(listener), 1);
            };
        },
        callListeners: function () {
            var listeners = currentListeners = nextListeners;
            listeners.forEach(function (listener) { return listener(); });
        }
    };
}
var setupElectronStore = function (_a) {
    var params = _a.params, flags = _a.flags, storeCreator = _a.storeCreator, reducer = _a.reducer, initialState = _a.initialState, forwarder = _a.forwarder;
    var parsedReducer = function (state, action) {
        if (flags.isUpdating) {
            flags.isUpdating = false;
            var _a = action.payload, updated = _a.updated, deleted = _a.deleted;
            var withDeletions = filterObject(state, deleted);
            return objectMerge(withDeletions, updated);
        }
        else {
            var reduced = reducer(state, action);
            return params.excludeUnfilteredState ? fillShape(reduced, params.filter) : reduced;
        }
    };
    var store = storeCreator(parsedReducer, initialState);
    var _b = getSubscribeFuncs(), subscribe = _b.subscribe, callListeners = _b.callListeners;
    store.subscribe = function (listener) { return subscribe(flags, listener); };
    var storeDotDispatch = store.dispatch;
    var doDispatch = function (action) {
        flags.isDispatching = true;
        try {
            params.preDispatchCallback(action);
            storeDotDispatch(action);
        }
        finally {
            flags.isDispatching = false;
        }
    };
    store.dispatch = function (action) {
        if (flags.isUpdating || !action || !params.actionFilter(action)) {
            doDispatch(action);
            if (flags.forwardOnUpdate) {
                forwarder(action);
            }
        }
        else {
            var prevState = store.getState();
            doDispatch(action);
            var newState = store.getState();
            var delta = objectDifference(prevState, newState);
            if (isEmpty(delta.updated) && isEmpty(delta.deleted)) {
                return action;
            }
            forwarder({ type: action.type, payload: delta });
        }
        callListeners();
        params.postDispatchCallback(action);
        return action;
    };
    return store;
};

var defaultParams = {
    postDispatchCallback: function (action) { return null; },
    preDispatchCallback: function (action) { return null; },
    actionFilter: function () { return true; }
};
/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 */
var mainEnhancer = function (overrides) { return function (storeCreator) {
    return function (reducer, initialState) {
        var params = Object.assign({}, defaultParams, overrides);
        var clients = {}; // webContentsId -> {webContents, filter, clientId, windowId, active}
        // Need to keep track of windows, as when a window refreshes it creates a new
        // webContents, and the old one must be unregistered
        var windowMap = {}; // windowId -> webContentsId
        // Cannot delete data, as events could still be sent after close
        // events when a BrowserWindow is created using remote
        var unregisterRenderer = function (webContentsId) {
            clients[webContentsId] = { active: false };
        };
        electron.ipcMain.on(Message.RegisterRenderer, function (_a, _b) {
            var sender = _a.sender;
            var filter = _b.filter, clientId = _b.clientId, isGuest = _b.isGuest;
            var webContentsId = sender.id;
            var browserWindow = electron.BrowserWindow.fromWebContents(sender);
            if (!isGuest) {
                // For windowMap (not webviews)
                if (windowMap[browserWindow.id] !== undefined) {
                    // Occurs on window reload
                    unregisterRenderer(windowMap[browserWindow.id]);
                }
                windowMap[browserWindow.id] = webContentsId;
                // Webcontents aren't automatically destroyed on window close
                browserWindow.on("closed", function () { return unregisterRenderer(webContentsId); });
            }
            // Update clients after the unregisterRenderer method call(webContentsId should not be removed
            // after the window refresh).
            clients[webContentsId] = {
                webContents: sender,
                filter: filter,
                clientId: clientId,
                windowId: browserWindow.id,
                active: true
            };
        });
        var forwarder = function (_a) {
            var type = _a.type, payload = _a.payload;
            // Forward all actions to the listening renderers
            for (var webContentsId in clients) {
                if (!clients[webContentsId].active)
                    continue;
                if (clients[webContentsId].clientId === context.flags.senderClientId)
                    continue;
                var webContents = clients[webContentsId].webContents;
                if (!webContents ||
                    webContents.isDestroyed() ||
                    webContents.isCrashed()) {
                    unregisterRenderer(webContentsId);
                    continue;
                }
                var shape = clients[webContentsId].filter;
                var updated = fillShape(payload.updated, shape);
                var deleted = fillShape(payload.deleted, shape);
                if (isEmpty(updated) && isEmpty(deleted)) {
                    continue;
                }
                var action = { type: type, payload: { updated: updated, deleted: deleted } };
                webContents.send(Message.BrowserDispatch, JSON.stringify(action));
            }
        };
        var context = {
            params: params,
            flags: {
                isDispatching: false,
                isUpdating: false,
                forwardOnUpdate: true,
                senderClientId: null
            },
            storeCreator: storeCreator,
            reducer: reducer,
            initialState: initialState,
            forwarder: forwarder
        };
        var store = setupElectronStore(context);
        global["__REDUX_ELECTRON_STORE__InitialState"] = function () {
            return JSON.stringify(store.getState());
        };
        var dispatcher = params.dispatchProxy || store.dispatch;
        electron.ipcMain.on(Message.RendererDispatch, function (event, clientId, stringifiedAction) {
            context.flags.isUpdating = true;
            var action = JSON.parse(stringifiedAction);
            context.flags.senderClientId = clientId;
            dispatcher(action);
            context.flags.senderClientId = null;
        });
        return store;
    };
}; };

/**
 * Creates a store enhancer which allows a redux store to synchronize its data
 * with an electronEnhanced store in the browser process.
 * @param {Object} p - The parameters to the creator
 * @param {Object|Function|true} p.filter - Describes what data should be forwarded to this process
 *                                          from the browser
 * @param {Boolean} p.excludeUnfilteredState - Whether to have all data not passing the filter to be
 *                                             undefined (Helpful to avoid bugs at the cost of
 *                                             performance)
 * @param {Function} p.postDispatchCallback - A callback to run after a dispatch has occurred.
 * @param {Function} p.preDispatchCallback - A callback to run before an action is dispatched.
 * @param {Function} p.dispatchProxy - In order to allow the actions dispatched by electronEnhancer
 *                                     to pass through the entire store enhancer stack, the final
 *                                     store.dispatch must be injected into redux-electron-store
 *                                     manually.
 * @param {Function} p.actionFilter - A function which takes in an action and returns a boolean
 *                                    determining whether to forward the action to other processes
 *                                    or not
 */
var defaultParams$1 = {
    filter: true,
    excludeUnfilteredState: false,
    postDispatchCallback: function () { return null; },
    preDispatchCallback: function () { return null; },
    dispatchProxy: null,
    actionFilter: function () { return true; }
};
var renderEnhancer = function (overrides) { return function (storeCreator) {
    return function (reducer, providedInitialState) {
        var params = Object.assign({}, defaultParams$1, overrides);
        var rendererId = process.guestInstanceId || electron.remote.getCurrentWindow().id;
        var clientId = process.guestInstanceId
            ? "webview " + rendererId
            : "window " + rendererId;
        var isGuest = !!process.guestInstanceId;
        // Allows the main process to forward updates to this renderer automatically
        electron.ipcRenderer.send(Message.RegisterRenderer, {
            filter: params.filter,
            clientId: clientId,
            isGuest: isGuest
        });
        // Get current from the electronEnhanced store in the browser through the global it creates
        var getInitialState = electron.remote.getGlobal(Global.InitialState);
        var storeData = JSON.parse(getInitialState());
        var preload = params.excludeUnfilteredState
            ? fillShape(storeData, params.filter)
            : storeData;
        var initialState = objectMerge(preload, providedInitialState || {});
        // Forward update to the main process so that it can forward the update to all other renderers
        var forwarder = function (action) {
            return electron.ipcRenderer.send(Message.RendererDispatch, clientId, JSON.stringify(action));
        };
        var context = {
            params: params,
            flags: {
                isDispatching: false,
                isUpdating: false,
                forwardOnUpdate: false
            },
            storeCreator: storeCreator,
            reducer: reducer,
            initialState: initialState,
            forwarder: forwarder
        };
        var store = setupElectronStore(context);
        // Dispatches from other processes are forwarded using this ipc message
        var dispatcher = context.params.dispatchProxy || store.dispatch;
        electron.ipcRenderer.on(Message.BrowserDispatch, function (event, stringifiedAction) {
            context.flags.isUpdating = true;
            var action = JSON.parse(stringifiedAction);
            dispatcher(action);
        });
        return store;
    };
}; };

var storeEnhancer;
if (process.type === "browser") {
    storeEnhancer = mainEnhancer;
}
else {
    storeEnhancer = renderEnhancer;
}
var electronEnhancer = storeEnhancer;

exports.electronEnhancer = electronEnhancer;
