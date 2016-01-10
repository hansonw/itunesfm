"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = promisify;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function promisify(obj, func) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return new _promise2.default(function (resolve, reject) {
    obj[func].apply(obj, args.concat(function (err, result) {
      if (err != null) {
        reject(err);
      } else {
        resolve(result);
      }
    }));
  });
}