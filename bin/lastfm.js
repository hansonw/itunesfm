'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.matchTrack = exports.getTopTracks = undefined;

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

var _levenshteinEditDistance = require('levenshtein-edit-distance');

var _levenshteinEditDistance2 = _interopRequireDefault(_levenshteinEditDistance);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lfm = new _lastfmapi2.default({
  'api_key': 'f21088bf9097b49ad4e7f487abab981e',
  'secret': '7ccaec2093e33cded282ec7bc81c6fca'
});

var URL_REGEX = /^.+last.fm\/music\/([^/]+)\/[^/]+\/([^/]+)$/;
var LEVENSHTEIN_THRESHOLD = 0.8;
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

function tryDecode(url) {
  try {
    return decodeURIComponent(url);
  } catch (e) {}
  return url;
}

function findMatchingTracks(tracks, name, artist, urls) {
  var matches = [];
  var nameMatches = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(tracks), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _track2 = _step.value;

      if (urls != null) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = (0, _getIterator3.default)(urls), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _url = _step3.value;

            if (_track2.url === _url || tryDecode(_track2.url) === _url) {
              matches.push(_track2);
              break;
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        continue;
      }

      if (match(_track2.name, name)) {
        nameMatches.push(_track2);
        if (match(_track2.artist.name, artist)) {
          matches.push(_track2);
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

  if (urls == null && matches.length + nameMatches.length === 0) {
    // Try Levenshtein distance; return anything > 80%.
    var close = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = (0, _getIterator3.default)(tracks), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var _track = _step2.value;

        var dist = (0, _levenshteinEditDistance2.default)(name, _track.name, true);
        var ratio = (name.length - dist) / name.length;
        if (ratio >= LEVENSHTEIN_THRESHOLD) {
          close.push([-ratio, _track]);
        }
        nameMatches = close.sort().map(function (x) {
          return x[1];
        });
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }

  return { matches: matches, nameMatches: nameMatches };
}

function normalizeURL(url) {
  var match = URL_REGEX.exec(url);
  if (match == null) {
    console.warn('warning: invalid URL ' + url + ' in matching.json');
    return url;
  }
  // The album is never provided by last.fm's API.
  return 'http://www.last.fm/music/' + match[1] + '/_/' + match[2];
}

var matchTrack = exports.matchTrack = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(tracks, name, artist, urls) {
    var _findMatchingTracks, matches, nameMatches, result;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _findMatchingTracks = findMatchingTracks(tracks, name, artist, urls);
            matches = _findMatchingTracks.matches;
            nameMatches = _findMatchingTracks.nameMatches;
            result = [];

            if (matches.length + nameMatches.length === 0) {
              // TODO: use heuristics to determine possible matches
            } else if (matches.length === 1 || nameMatches.length === 1) {
                result = [matches[0] || nameMatches[0]];
              } else {
                result = matches.length ? matches : nameMatches;
              }
            return _context2.abrupt('return', result);

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function matchTrack(_x3, _x4, _x5, _x6) {
    return ref.apply(this, arguments);
  };
}();