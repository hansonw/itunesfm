'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lastfm = require('./lastfm');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _itunesxml = require('./itunesxml');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_prompt2.default.colors = false;

// Store ambiguous songs in this DB.
var MATCHING_FILE = 'matching.json';

function idx(x, key) {
  if (x == null) {
    return null;
  }
  return x[key];
}

var quickPrompt = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(message) {
    var _ref, result;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _q2.default.ninvoke(_prompt2.default, 'get', { properties: { result: { message: message } } });

          case 2:
            _ref = _context.sent;
            result = _ref.result;
            return _context.abrupt('return', result);

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function quickPrompt(_x) {
    return ref.apply(this, arguments);
  };
}();

var promptForMatch = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(name, artist, matches) {
    var i, num;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log('Multiple matches for %s by %s. Please pick one:', name || '??', artist || '??');
            for (i = 0; i < matches.length; i++) {
              console.log('%d: %s by %s (%d plays)', i + 1, matches[i].name, matches[i].artist.name, matches[i].playcount);
            }
            _context2.next = 4;
            return quickPrompt('Enter a number (0 for none)');

          case 4:
            _context2.t0 = _context2.sent;
            num = parseInt(_context2.t0, 10);

            if (!(num <= 0 || num >= matches.length)) {
              _context2.next = 8;
              break;
            }

            return _context2.abrupt('return', null);

          case 8:
            return _context2.abrupt('return', matches[num - 1]);

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function promptForMatch(_x2, _x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

var matchTrack = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(tracks, name, artist, key, matching) {
    var _findMatchingTracks, matches, nameMatches, match;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _findMatchingTracks = (0, _lastfm.findMatchingTracks)(tracks, name, artist, key && matching[key]);
            matches = _findMatchingTracks.matches;
            nameMatches = _findMatchingTracks.nameMatches;
            match = undefined;

            if (!(matches.length + nameMatches.length === 0)) {
              _context3.next = 8;
              break;
            }

            console.log('warning: could not match ' + name + ': ' + artist);
            _context3.next = 16;
            break;

          case 8:
            if (!(matches.length === 1 || nameMatches.length === 1)) {
              _context3.next = 12;
              break;
            }

            match = matches[0] || nameMatches[0];
            _context3.next = 16;
            break;

          case 12:
            _context3.next = 14;
            return promptForMatch(name, artist, matches.length ? matches : nameMatches);

          case 14:
            match = _context3.sent;

            if (match != null && key) {
              matching[key] = match.url;
            }

          case 16:
            return _context3.abrupt('return', match);

          case 17:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return function matchTrack(_x5, _x6, _x7, _x8, _x9) {
    return ref.apply(this, arguments);
  };
}();

var main = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
    var username, useCached, topTracks, matching, win32ole, iTunesApp, tracks, _i, track, name, artist, key, match, myPlayCount, matchPlayCount, _ref2,
    // Try matching iTunes tracks to last.fm tracks.
    // getTopTracks doesn't give us album info :( but ambiguities are rare.
    // TODO: explicitly fetch album data when this happens.
    path, data, _i2, dict, kind, playCount, ok;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            username = process.argv[2];

            if (!(username == null)) {
              _context4.next = 6;
              break;
            }

            _context4.next = 5;
            return quickPrompt('Enter your last.fm username');

          case 5:
            username = _context4.sent;

          case 6:
            useCached = process.argv.indexOf('cache') !== -1;
            _context4.next = 9;
            return (0, _lastfm.getTopTracks)(username, useCached);

          case 9:
            topTracks = _context4.sent;

            console.log('Finished fetching %d play counts.', topTracks.length);

            matching = {};

            try {
              matching = JSON.parse(_fs2.default.readFileSync(MATCHING_FILE).toString());
            } catch (e) {}

            _context4.prev = 13;

            if (!(_os2.default.platform() === 'win32')) {
              _context4.next = 33;
              break;
            }

            win32ole = require('win32ole');
            iTunesApp = win32ole.client.Dispatch('iTunes.Application');
            tracks = iTunesApp.LibraryPlaylist().Tracks();
            _i = 1;

          case 19:
            if (!(_i <= tracks.Count())) {
              _context4.next = 31;
              break;
            }

            track = tracks.Item(_i);
            name = track.Name();
            artist = track.Artist();
            key = iTunesApp.ITObjectPersistentIDHigh(track).toString();
            _context4.next = 26;
            return matchTrack(topTracks, name, artist, key, matching);

          case 26:
            match = _context4.sent;

            if (match != null) {
              myPlayCount = track.PlayedCount();
              matchPlayCount = parseInt(match.playcount, 10);

              if (myPlayCount < matchPlayCount) {
                console.log('up ' + name + ': ' + myPlayCount + ' -> ' + matchPlayCount);
                track.PlayedCount = matchPlayCount;
              }
            }

          case 28:
            _i++;
            _context4.next = 19;
            break;

          case 31:
            _context4.next = 34;
            break;

          case 33:
            throw new Error('not implemented');

          case 34:
            _context4.next = 73;
            break;

          case 36:
            _context4.prev = 36;
            _context4.t0 = _context4['catch'](13);

            console.log('Native API failed. Falling back to loading XML files.');_context4.next = 41;
            return (0, _itunesxml.loadITunesLibrary)();

          case 41:
            _ref2 = _context4.sent;
            path = _ref2.path;
            data = _ref2.data;
            tracks = (0, _itunesxml.findDictValue)(data.firstChild, 'Tracks');

            (0, _assert2.default)(tracks, 'could not get tracks in library');
            _i2 = 0;

          case 47:
            if (!(_i2 < tracks.children.length)) {
              _context4.next = 69;
              break;
            }

            dict = tracks.children[_i2 + 1];
            kind = idx((0, _itunesxml.findDictValue)(dict, 'Kind'), 'val');

            if (!(kind == null || kind.indexOf('audio file') === -1)) {
              _context4.next = 52;
              break;
            }

            return _context4.abrupt('continue', 66);

          case 52:
            name = idx((0, _itunesxml.findDictValue)(dict, 'Name'), 'val');
            artist = idx((0, _itunesxml.findDictValue)(dict, 'Artist'), 'val');
            key = idx((0, _itunesxml.findDictValue)(dict, 'Location'), 'val');
            _context4.next = 57;
            return matchTrack(topTracks, name, artist, key, matching);

          case 57:
            match = _context4.sent;

            if (!(match != null)) {
              _context4.next = 66;
              break;
            }

            playCount = (0, _itunesxml.findDictValue)(dict, 'Play Count');

            if (!(playCount == null)) {
              _context4.next = 63;
              break;
            }

            console.log('skipping ' + name + ': ' + artist + ' due to no play count');
            // TODO: add a play count entry!
            return _context4.abrupt('continue', 66);

          case 63:
            myPlayCount = parseInt(playCount.val, 10);
            matchPlayCount = parseInt(match.playcount, 10);

            if (myPlayCount < matchPlayCount) {
              // console.log(`updating ${name}: ${artist} to ${match.playcount}`);
              playCount.val = match.playcount;
            }

          case 66:
            _i2 += 2;
            _context4.next = 47;
            break;

          case 69:
            _context4.next = 71;
            return quickPrompt('Save changes? y/n');

          case 71:
            ok = _context4.sent;

            if (ok === 'y') {
              console.log('Saving changes..');
              (0, _itunesxml.saveITunesLibrary)(path, data);
              console.log('Restart iTunes to see changes.');
            }

          case 73:

            _fs2.default.writeFileSync(MATCHING_FILE, (0, _stringify2.default)(matching));
            _context4.next = 79;
            break;

          case 76:
            _context4.prev = 76;
            _context4.t1 = _context4['catch'](0);

            console.error(_context4.t1);

          case 79:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[0, 76], [13, 36]]);
  }));
  return function main() {
    return ref.apply(this, arguments);
  };
}();

main();