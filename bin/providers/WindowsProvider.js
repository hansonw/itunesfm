'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _Provider = require('./Provider');

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WindowsProvider = {
  getTracks: function getTracks() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
      var proc, stdout;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              proc = _child_process2.default.spawn('wscript.exe', ['scripts/win_getTracks.js']);
              stdout = '';

              proc.stdout.on('data', function (data) {
                stdout += data;
              });
              return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
                proc.on('close', function (code) {
                  if (code !== 0) {
                    reject(new Error('getTracks failed with code ' + code));
                  }
                  resolve(JSON.parse(decodeURIComponent(stdout)));
                });
              }));

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  updateTracks: function updateTracks(counts) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
      var proc;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              proc = _child_process2.default.spawn('wscript.exe', ['scripts/win_updateTracks.js']);

              proc.stdin.write(encodeURIComponent((0, _stringify2.default)(counts)) + '\n');
              proc.stdout.on('data', function (data) {
                console.log(data.toString());
              });
              return _context2.abrupt('return', new _promise2.default(function (resolve, reject) {
                proc.on('close', function (code) {
                  if (code !== 0) {
                    reject(new Error('updateTracks failed with code ' + code));
                  }
                  resolve();
                });
              }));

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
};

module.exports = WindowsProvider;