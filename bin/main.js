'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

var _promisify = require('./promisify');

var _promisify2 = _interopRequireDefault(_promisify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_prompt2.default.colors = false;

// Store ambiguous songs in this DB.
var MATCHING_FILE = 'matching.json';

var quickPrompt = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(message) {
    var _ref, result;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!true) {
              _context.next = 9;
              break;
            }

            _context.next = 3;
            return (0, _promisify2.default)(_prompt2.default, 'get', { properties: { result: { message: message } } });

          case 3:
            _ref = _context.sent;
            result = _ref.result;

            if (!result) {
              _context.next = 7;
              break;
            }

            return _context.abrupt('return', result);

          case 7:
            _context.next = 0;
            break;

          case 9:
            return _context.abrupt('return', '');

          case 10:
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

// for Flow

var promptForMatch = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(name, artist, matches) {
    var i, reply, result, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, num, match;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log('Multiple matches for %s by %s. Enter valid numbers (comma separated):', name || '??', artist || '??');
            for (i = 0; i < matches.length; i++) {
              console.log('%d: %s by %s (%d plays)', i + 1, matches[i].name, matches[i].artist.name, matches[i].playcount);
            }
            _context2.next = 4;
            return quickPrompt('Enter some numbers (0 for none, a for all)');

          case 4:
            reply = _context2.sent;

            if (!(reply === 'a' || reply === 'A')) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt('return', matches);

          case 7:
            result = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context2.prev = 11;

            for (_iterator = (0, _getIterator3.default)(reply.split(',')); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              num = _step.value;
              match = matches[parseInt(num, 10) - 1];

              if (match != null) {
                result.push(match);
              }
            }
            _context2.next = 19;
            break;

          case 15:
            _context2.prev = 15;
            _context2.t0 = _context2['catch'](11);
            _didIteratorError = true;
            _iteratorError = _context2.t0;

          case 19:
            _context2.prev = 19;
            _context2.prev = 20;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 22:
            _context2.prev = 22;

            if (!_didIteratorError) {
              _context2.next = 25;
              break;
            }

            throw _iteratorError;

          case 25:
            return _context2.finish(22);

          case 26:
            return _context2.finish(19);

          case 27:
            return _context2.abrupt('return', result);

          case 28:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[11, 15, 19, 27], [20,, 22, 26]]);
  }));
  return function promptForMatch(_x2, _x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

var URL_REGEX = /^.+last.fm\/music\/([^/]+)\/[^/]+\/([^/]+)$/;
function normalizeURL(url) {
  var match = URL_REGEX.exec(url);
  if (match == null) {
    console.warn('warning: invalid URL ' + url + ' in matching.json');
    return url;
  }
  // The album is never provided by last.fm's API.
  return 'http://www.last.fm/music/' + match[1] + '/_/' + match[2];
}

var matchTrack = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(tracks, name, artist, id, matching) {
    var urls, _findMatchingTracks, matches, nameMatches, result;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            urls = matching[id] && matching[id].map(normalizeURL);
            _findMatchingTracks = (0, _lastfm.findMatchingTracks)(tracks, name, artist, urls);
            matches = _findMatchingTracks.matches;
            nameMatches = _findMatchingTracks.nameMatches;

            if (!(urls != null)) {
              _context3.next = 7;
              break;
            }

            if (matches.length === 0) {
              console.warn('warning: you specified urls for ' + id + ' but no matches were found');
            }
            return _context3.abrupt('return', matches);

          case 7:
            result = [];

            if (!(matches.length + nameMatches.length === 0)) {
              _context3.next = 12;
              break;
            }

            console.warn('warning: could not match ' + name + ' by ' + artist + ' (id = ' + id + ')');
            // TODO: use heuristics to determine possible matches
            _context3.next = 20;
            break;

          case 12:
            if (!(matches.length === 1 || nameMatches.length === 1)) {
              _context3.next = 16;
              break;
            }

            result = [matches[0] || nameMatches[0]];
            _context3.next = 20;
            break;

          case 16:
            _context3.next = 18;
            return promptForMatch(name, artist, matches.length ? matches : nameMatches);

          case 18:
            result = _context3.sent;

            // Record the absence of a match as well.
            matching[id] = result.map(function (x) {
              return x.url;
            });

          case 20:
            return _context3.abrupt('return', result);

          case 21:
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
    var provider, tracksPromise, username, useCached, topTracks, myTracks, matching, updates, id, _myTracks$id, name, artist, playedCount, matches, matchPlayCount, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _match, ok;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            provider = undefined;

            if (!(_os2.default.platform() === 'win32')) {
              _context4.next = 6;
              break;
            }

            provider = require('./providers/WindowsProvider.js');
            _context4.next = 11;
            break;

          case 6:
            if (!(_os2.default.platform() === 'darwin')) {
              _context4.next = 10;
              break;
            }

            provider = require('./providers/OSXProvider');
            _context4.next = 11;
            break;

          case 10:
            throw new Error('platform ' + _os2.default.platform() + ' not supported');

          case 11:
            // Start fetching from iTunes immediately.
            tracksPromise = provider.getTracks();
            username = process.argv[2];

            if (!(username == null)) {
              _context4.next = 17;
              break;
            }

            _context4.next = 16;
            return quickPrompt('Enter your last.fm username');

          case 16:
            username = _context4.sent;

          case 17:
            useCached = process.argv.indexOf('cache') !== -1;
            _context4.next = 20;
            return (0, _lastfm.getTopTracks)(username, useCached);

          case 20:
            topTracks = _context4.sent;
            _context4.next = 23;
            return tracksPromise;

          case 23:
            myTracks = _context4.sent;

            console.log('Found %d tracks locally, %d on last.fm.', (0, _keys2.default)(myTracks).length, topTracks.length);

            matching = {};

            try {
              matching = JSON.parse(_fs2.default.readFileSync(MATCHING_FILE).toString());
            } catch (e) {}

            updates = {};
            _context4.t0 = _regenerator2.default.keys(myTracks);

          case 29:
            if ((_context4.t1 = _context4.t0()).done) {
              _context4.next = 61;
              break;
            }

            id = _context4.t1.value;
            _myTracks$id = myTracks[id];
            name = _myTracks$id.name;
            artist = _myTracks$id.artist;
            playedCount = _myTracks$id.playedCount;
            _context4.next = 37;
            return matchTrack(topTracks, name, artist, id, matching);

          case 37:
            matches = _context4.sent;
            matchPlayCount = 0;
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context4.prev = 42;

            for (_iterator2 = (0, _getIterator3.default)(matches); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              _match = _step2.value;

              matchPlayCount += parseInt(_match.playcount, 10);
            }
            _context4.next = 50;
            break;

          case 46:
            _context4.prev = 46;
            _context4.t2 = _context4['catch'](42);
            _didIteratorError2 = true;
            _iteratorError2 = _context4.t2;

          case 50:
            _context4.prev = 50;
            _context4.prev = 51;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 53:
            _context4.prev = 53;

            if (!_didIteratorError2) {
              _context4.next = 56;
              break;
            }

            throw _iteratorError2;

          case 56:
            return _context4.finish(53);

          case 57:
            return _context4.finish(50);

          case 58:
            if (playedCount < matchPlayCount) {
              console.log('will update ' + name + ': ' + artist + ' to ' + matchPlayCount);
              updates[id] = matchPlayCount;
            }
            _context4.next = 29;
            break;

          case 61:
            if (!((0, _keys2.default)(updates).length === 0)) {
              _context4.next = 65;
              break;
            }

            console.log('No play counts were changed.');
            _context4.next = 72;
            break;

          case 65:
            _context4.next = 67;
            return quickPrompt('Save changes? y/n');

          case 67:
            ok = _context4.sent;

            if (!(ok === 'y')) {
              _context4.next = 72;
              break;
            }

            console.log('Saving changes..');
            _context4.next = 72;
            return provider.updateTracks(updates);

          case 72:

            _fs2.default.writeFileSync(MATCHING_FILE, (0, _stringify2.default)(matching));
            _context4.next = 78;
            break;

          case 75:
            _context4.prev = 75;
            _context4.t3 = _context4['catch'](0);

            console.error(_context4.t3);

          case 78:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[0, 75], [42, 46, 50, 58], [51,, 53, 57]]);
  }));
  return function main() {
    return ref.apply(this, arguments);
  };
}();

main();