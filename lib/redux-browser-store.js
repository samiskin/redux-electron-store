'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _objectDifference = require('./utils/object-difference.js');

var _objectDifference2 = _interopRequireDefault(_objectDifference);

var _reduxElectronStore = require('./redux-electron-store');

var _reduxElectronStore2 = _interopRequireDefault(_reduxElectronStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ipcMain = require('electron').ipcMain;

var ReduxBrowserStore = (function (_ReduxElectronStore) {
  _inherits(ReduxBrowserStore, _ReduxElectronStore);

  function ReduxBrowserStore(reduxStoreCreator, reducer) {
    _classCallCheck(this, ReduxBrowserStore);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReduxBrowserStore).call(this, reduxStoreCreator, reducer));

    _this.windows = {};
    _this.filters = {};

    ipcMain.on('renderer-dispatch', function (event, action) {
      _this.dispatch(action);
    });
    return _this;
  }

  _createClass(ReduxBrowserStore, [{
    key: 'registerWindow',
    value: function registerWindow(browserWindow) {
      var filter = arguments.length <= 1 || arguments[1] === undefined ? function () {
        return true;
      } : arguments[1];

      this.windows[browserWindow.id] = browserWindow;
      this.filters[browserWindow.id] = filter;
    }
  }, {
    key: 'dispatch',
    value: function dispatch(action) {

      action.source = action.source || 'browser';
      var prevState = this.getState();
      _get(Object.getPrototypeOf(ReduxBrowserStore.prototype), 'dispatch', this).call(this, action);
      var newState = this.getState();

      var stateDifference = (0, _objectDifference2.default)(prevState, newState);

      var payload = { type: action.type, data: stateDifference };

      for (var winId in this.windows) {
        if (this.filters[winId](prevState, newState)) {
          this.windows[winId].webContents.send('browser-dispatch', payload);
        }
      }
    }
  }]);

  return ReduxBrowserStore;
})(_reduxElectronStore2.default);

exports.default = ReduxBrowserStore;