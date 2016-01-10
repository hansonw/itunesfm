'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTopTracks = undefined;
exports.findMatchingTracks = findMatchingTracks;

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lastfmapi = require('lastfmapi');

var _lastfmapi2 = _interopRequireDefault(_lastfmapi);

var _promisify = require('./promisify');

var _promisify2 = _interopRequireDefault(_promisify);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lfm = new _lastfmapi2.default({
  'api_key': 'f21088bf9097b49ad4e7f487abab981e',
  'secret': '7ccaec2093e33cded282ec7bc81c6fca'
});
// streamable, image, @attr are omitted

var getTopTracks = exports.getTopTracks = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(user, useCached) {
    var CACHE_FILE, tracks, _page, result, _total;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            CACHE_FILE = 'cache.json';

            if (!useCached) {
              _context.next = 8;
              break;
            }

            _context.prev = 2;
            return _context.abrupt('return', JSON.parse(_fs2.default.readFileSync(CACHE_FILE).toString()));

          case 6:
            _context.prev = 6;
            _context.t0 = _context['catch'](2);

          case 8:
            // cache doesn't exist; this is normal

            console.log('Fetching play counts from last.fm..');
            tracks = [];
            _page = 1;

          case 11:
            _context.next = 13;
            return (0, _promisify2.default)(lfm.user, 'getTopTracks', {
              user: user,
              limit: 5000, // API per-page limit
              page: _page
            });

          case 13:
            result = _context.sent;

            tracks = tracks.concat(result.track);
            _total = result['@attr'].total;

            if (!(tracks.length >= parseInt(_total, 10))) {
              _context.next = 18;
              break;
            }

            return _context.abrupt('break', 22);

          case 18:
            console.log('Fetching play counts.. (%d/%d)', tracks.length, _total);

          case 19:
            _page++;
            _context.next = 11;
            break;

          case 22:
            // cache results for development purposes
            _fs2.default.writeFileSync(CACHE_FILE, (0, _stringify2.default)(tracks));
            return _context.abrupt('return', tracks);

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 6]]);
  }));
  return function getTopTracks(_x, _x2) {
    return ref.apply(this, arguments);
  };
}();

function match(a, b) {
  if (a == null || b == null) {
    return true;
  }
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

function findMatchingTracks(tracks, name, artist, url) {
  var matches = [];
  var nameMatches = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(tracks), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _track = _step.value;

      if (url != null) {
        if (_track.url === url) {
          matches.push(_track);
          break;
        }
        continue;
      }

      if (match(_track.name, name)) {
        nameMatches.push(_track);
        if (match(_track.artist.name, artist)) {
          matches.push(_track);
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return { matches: matches, nameMatches: nameMatches };
}