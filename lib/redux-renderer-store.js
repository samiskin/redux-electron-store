'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _filterObject = require('./utils/filter-object');

var _filterObject2 = _interopRequireDefault(_filterObject);

var _objectMerge = require('./utils/object-merge');

var _objectMerge2 = _interopRequireDefault(_objectMerge);

var _reduxElectronStore = require('./redux-electron-store');

var _reduxElectronStore2 = _interopRequireDefault(_reduxElectronStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ipcRenderer = require('electron').ipcRenderer;

var ReduxRendererStore = (function (_ReduxElectronStore) {
  _inherits(ReduxRendererStore, _ReduxElectronStore);

  function ReduxRendererStore(reduxStoreCreator, reducer) {
    _classCallCheck(this, ReduxRendererStore);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReduxRendererStore).call(this, reduxStoreCreator, reducer));

    _this.windowId = require('remote').getCurrentWindow().id;

    ipcRenderer.on('browser-dispatch', function (event, action) {
      _this.reduxStore.dispatch(action);
    });
    return _this;
  }

  _createClass(ReduxRendererStore, [{
    key: 'parseReducer',
    value: function parseReducer(reducer) {
      return function (state, action) {
        if (action.source === 'browser') {
          var filteredState = (0, _filterObject2.default)(state, action.data.deleted);
          return (0, _objectMerge2.default)(filteredState, action.data.updated);
        } else {
          return reducer(state, action);
        }
      };
    }
  }, {
    key: 'dispatch',
    value: function dispatch(action) {
      action.source = 'renderer ' + this.windowId;
      ipcRenderer.send('renderer-dispatch', action);
    }
  }]);

  return ReduxRendererStore;
})(_reduxElectronStore2.default);

exports.default = ReduxRendererStore;