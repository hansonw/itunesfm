"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

const osa = require('osa');

function Application() {} // stub for Flow


function osaPromise(fn, ...args) {
  return new Promise((resolve, reject) => {
    osa(fn, ...args, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

const OSXProvider = {
  getTracks() {
    return (0, _asyncToGenerator2.default)(function* () {
      return yield osaPromise(() => {
        var itunes = Application('Music');
        var tracks = itunes.libraryPlaylists[0].tracks;
        var result = {};

        for (var i = 0; i < tracks.length; i++) {
          var track = tracks[i];
          result[track.persistentID()] = {
            name: track.name(),
            artist: track.artist(),
            playedCount: track.playedCount()
          };
        }

        return result;
      });
    })();
  },

  updateTracks(counts) {
    return (0, _asyncToGenerator2.default)(function* () {
      yield osaPromise(counts => {
        var itunes = Application('Music');
        var tracks = itunes.libraryPlaylists[0].tracks;

        for (var i = 0; i < tracks.length; i++) {
          var track = tracks[i];
          var id = track.persistentID();

          if (counts[id]) {
            track.playedCount = counts[id];
          }
        }
      }, counts);
    })();
  }

};
module.exports = OSXProvider;