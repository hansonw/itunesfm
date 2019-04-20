'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var osa = require('osa');

function Application() {} // stub for Flow

function osaPromise(fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return new _promise2.default(function (resolve, reject) {
    osa.apply(undefined, [fn].concat(args, [function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }]));
  });
}

var OSXProvider = {
  getTracks: function getTracks() {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return osaPromise(function () {
                var itunes = Application('iTunes');
                var tracks = itunes.libraryPlaylists[0].tracks;
                var result = {};
                for (var i = 0; i < tracks.length; i++) {
                  var track = tracks[i];
                  if (track.videoKind() !== 'none') {
                    continue;
                  }
                  result[track.persistentID()] = {
                    name: track.name(),
                    artist: track.artist(),
                    playedCount: track.playedCount()
                  };
                }
                return result;
              });

            case 2:
              return _context.abrupt('return', _context.sent);

            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  updateTracks: function updateTracks(counts) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return osaPromise(function (counts) {
                var itunes = Application('iTunes');
                var tracks = itunes.libraryPlaylists[0].tracks;
                for (var i = 0; i < tracks.length; i++) {
                  var track = tracks[i];
                  var id = track.persistentID();
                  if (counts[id]) {
                    track.playedCount = counts[id];
                  }
                }
              }, counts);

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
};

module.exports = OSXProvider;