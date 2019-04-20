#!/usr/bin/env node
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

var quickPrompt = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(message) {
    var _ref2, result;

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
            _ref2 = _context.sent;
            result = _ref2.result;

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
    return _ref.apply(this, arguments);
  };
}();

var promptForMatch = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(name, artist, matches) {
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
    return _ref3.apply(this, arguments);
  };
}();

var main = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var provider, tracksPromise, username, useCached, topTracks, myTracks, matching, updates, id, _myTracks$id, name, artist, playedCount, urls, matches, matchPlayCount, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, match, ok;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            provider = void 0;

            if (!(_os2.default.platform() === 'win32')) {
              _context3.next = 6;
              break;
            }

            provider = require('./providers/WindowsProvider.js');
            _context3.next = 11;
            break;

          case 6:
            if (!(_os2.default.platform() === 'darwin')) {
              _context3.next = 10;
              break;
            }

            provider = require('./providers/OSXProvider');
            _context3.next = 11;
            break;

          case 10:
            throw new Error('platform ' + _os2.default.platform() + ' not supported');

          case 11:
            // Start fetching from iTunes immediately.
            tracksPromise = provider.getTracks();
            username = process.argv[2];

            if (!(username == null)) {
              _context3.next = 17;
              break;
            }

            _context3.next = 16;
            return quickPrompt('Enter your last.fm username');

          case 16:
            username = _context3.sent;

          case 17:
            useCached = process.argv.indexOf('cache') !== -1;
            _context3.next = 20;
            return (0, _lastfm.getTopTracks)(username, useCached);

          case 20:
            topTracks = _context3.sent;
            _context3.next = 23;
            return tracksPromise;

          case 23:
            myTracks = _context3.sent;


            console.log('Found %d tracks locally, %d on last.fm.', (0, _keys2.default)(myTracks).length, topTracks.length);

            matching = {};

            try {
              matching = JSON.parse(_fs2.default.readFileSync(MATCHING_FILE).toString());
            } catch (e) {}

            updates = {};
            _context3.t0 = _regenerator2.default.keys(myTracks);

          case 29:
            if ((_context3.t1 = _context3.t0()).done) {
              _context3.next = 68;
              break;
            }

            id = _context3.t1.value;
            _myTracks$id = myTracks[id], name = _myTracks$id.name, artist = _myTracks$id.artist, playedCount = _myTracks$id.playedCount;
            urls = matching[id];
            _context3.next = 35;
            return (0, _lastfm.matchTrack)(topTracks, name, artist, urls);

          case 35:
            matches = _context3.sent;

            if (!(matches.length === 0)) {
              _context3.next = 40;
              break;
            }

            console.warn('warning: could not match ' + name + ' by ' + artist + ' (id = ' + id + ')');
            if (urls != null) {
              console.warn('additionally, you provided urls but none matched');
            }
            return _context3.abrupt('continue', 29);

          case 40:
            if (!(urls == null && matches.length > 1)) {
              _context3.next = 45;
              break;
            }

            _context3.next = 43;
            return promptForMatch(name, artist, matches);

          case 43:
            matches = _context3.sent;

            matching[id] = matches.map(function (x) {
              return x.url;
            });

          case 45:
            matchPlayCount = 0;
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context3.prev = 49;

            for (_iterator2 = (0, _getIterator3.default)(matches); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              match = _step2.value;

              matchPlayCount += parseInt(match.playcount, 10);
            }
            _context3.next = 57;
            break;

          case 53:
            _context3.prev = 53;
            _context3.t2 = _context3['catch'](49);
            _didIteratorError2 = true;
            _iteratorError2 = _context3.t2;

          case 57:
            _context3.prev = 57;
            _context3.prev = 58;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 60:
            _context3.prev = 60;

            if (!_didIteratorError2) {
              _context3.next = 63;
              break;
            }

            throw _iteratorError2;

          case 63:
            return _context3.finish(60);

          case 64:
            return _context3.finish(57);

          case 65:
            if (playedCount < matchPlayCount) {
              console.log('will update ' + name + ': ' + artist + ' to ' + matchPlayCount);
              updates[id] = matchPlayCount;
            }
            _context3.next = 29;
            break;

          case 68:
            if (!((0, _keys2.default)(updates).length === 0)) {
              _context3.next = 72;
              break;
            }

            console.log('No play counts were changed.');
            _context3.next = 79;
            break;

          case 72:
            _context3.next = 74;
            return quickPrompt('Save changes? y/n');

          case 74:
            ok = _context3.sent;

            if (!(ok === 'y')) {
              _context3.next = 79;
              break;
            }

            console.log('Saving changes..');
            _context3.next = 79;
            return provider.updateTracks(updates);

          case 79:

            _fs2.default.writeFileSync(MATCHING_FILE, (0, _stringify2.default)(matching));
            _context3.next = 85;
            break;

          case 82:
            _context3.prev = 82;
            _context3.t3 = _context3['catch'](0);

            console.error(_context3.t3);

          case 85:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[0, 82], [49, 53, 57, 65], [58,, 60, 64]]);
  }));

  return function main() {
    return _ref4.apply(this, arguments);
  };
}();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _promisify = require('./promisify');

var _promisify2 = _interopRequireDefault(_promisify);

var _lastfm = require('./lastfm');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_prompt2.default.colors = false;

// Store ambiguous songs in this DB.
var MATCHING_FILE = _path2.default.resolve(__dirname, '../matching.json');

main();