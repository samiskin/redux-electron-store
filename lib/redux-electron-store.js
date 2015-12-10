"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReduxElectronStore = (function () {
  function ReduxElectronStore(reduxStore) {
    _classCallCheck(this, ReduxElectronStore);

    this.reduxStore = reduxStore;
  }

  _createClass(ReduxElectronStore, [{
    key: "getReduxStore",
    value: function getReduxStore() {
      return this.reduxStore;
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.reduxStore.getState();
    }
  }, {
    key: "dispatch",
    value: function dispatch(action) {
      return this.reduxStore.dispatch(action);
    }
  }, {
    key: "subscribe",
    value: function subscribe(listener) {
      return this.reduxStore.subscribe(listener);
    }
  }, {
    key: "replaceReducer",
    value: function replaceReducer(nextReducer) {
      return this.reduxStore.nextReducer(nextReducer);
    }
  }]);

  return ReduxElectronStore;
})();

exports.default = ReduxElectronStore;