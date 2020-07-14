"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _child_process = _interopRequireDefault(require("child_process"));

var _path = _interopRequireDefault(require("path"));

const SCRIPTS_DIR = _path.default.resolve(__dirname, '../../scripts');

const WindowsProvider = {
  getTracks() {
    return (0, _asyncToGenerator2.default)(function* () {
      const proc = _child_process.default.spawn('wscript.exe', [_path.default.join(SCRIPTS_DIR, 'win_getTracks.js')]);

      let stdout = '';
      proc.stdout.on('data', data => {
        stdout += data;
      });
      return new Promise((resolve, reject) => {
        proc.on('close', code => {
          if (code !== 0) {
            reject(new Error(`getTracks failed with code ${code}`));
          }

          resolve(JSON.parse(decodeURIComponent(stdout)));
        });
      });
    })();
  },

  updateTracks(counts) {
    return (0, _asyncToGenerator2.default)(function* () {
      const proc = _child_process.default.spawn('wscript.exe', [_path.default.join(SCRIPTS_DIR, 'win_updateTracks.js')]);

      proc.stdin.write(encodeURIComponent(JSON.stringify(counts)) + '\n');
      let stdout = '';
      proc.stdout.on('data', data => {
        console.log(data.toString());
      });
      return new Promise((resolve, reject) => {
        proc.on('close', code => {
          if (code !== 0) {
            reject(new Error(`updateTracks failed with code ${code}`));
          }

          resolve();
        });
      });
    })();
  }

};
module.exports = WindowsProvider;