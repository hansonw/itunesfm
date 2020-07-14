"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTopTracks = getTopTracks;
exports.matchTrack = matchTrack;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lastfmapi = _interopRequireDefault(require("lastfmapi"));

var _promisify = _interopRequireDefault(require("./promisify"));

var _levenshteinEditDistance = _interopRequireDefault(require("levenshtein-edit-distance"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

const lfm = new _lastfmapi.default({
  'api_key': 'f21088bf9097b49ad4e7f487abab981e',
  'secret': '7ccaec2093e33cded282ec7bc81c6fca'
});
const URL_REGEX = /^.+last.fm\/music\/([^/]+)\/[^/]+\/([^/]+)$/;
const LEVENSHTEIN_THRESHOLD = 0.8;

function getTopTracks(_x, _x2) {
  return _getTopTracks.apply(this, arguments);
}

function _getTopTracks() {
  _getTopTracks = (0, _asyncToGenerator2.default)(function* (user, useCached) {
    const CACHE_FILE = _path.default.resolve(__dirname, '../cache.json');

    if (useCached) {
      try {
        return JSON.parse(_fs.default.readFileSync(CACHE_FILE).toString());
      } catch (e) {// cache doesn't exist; this is normal
      }
    }

    console.log('Fetching play counts from last.fm..');
    let tracks = [];

    for (let page = 1;; page++) {
      const result = yield (0, _promisify.default)(lfm.user, 'getTopTracks', {
        user,
        limit: 1000,
        // API per-page limit
        page: page
      });
      tracks = tracks.concat(result.track);
      const {
        total
      } = result['@attr'];

      if (tracks.length >= parseInt(total, 10)) {
        break;
      }

      console.log('Fetching play counts.. (%d/%d)', tracks.length, total);
    } // cache results for development purposes


    _fs.default.writeFileSync(CACHE_FILE, JSON.stringify(tracks));

    return tracks;
  });
  return _getTopTracks.apply(this, arguments);
}

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
  const matches = [];
  let nameMatches = [];

  for (const track of tracks) {
    if (urls != null) {
      for (const url of urls) {
        if (track.url === url || tryDecode(track.url) === url) {
          matches.push(track);
          break;
        }
      }

      continue;
    }

    if (match(track.name, name)) {
      nameMatches.push(track);

      if (match(track.artist.name, artist)) {
        matches.push(track);
      }
    }
  }

  if (urls == null && matches.length + nameMatches.length === 0) {
    // Try Levenshtein distance; return anything > 80%.
    const close = [];

    for (const track of tracks) {
      const dist = (0, _levenshteinEditDistance.default)(name, track.name, true);
      const ratio = (name.length - dist) / name.length;

      if (ratio >= LEVENSHTEIN_THRESHOLD) {
        close.push([-ratio, track]);
      }

      nameMatches = close.sort().map(x => x[1]);
    }
  }

  return {
    matches,
    nameMatches
  };
}

function normalizeURL(url) {
  const match = URL_REGEX.exec(url);

  if (match == null) {
    console.warn(`warning: invalid URL ${url} in matching.json`);
    return url;
  } // The album is never provided by last.fm's API.


  return `http://www.last.fm/music/${match[1]}/_/${match[2]}`;
}

function matchTrack(_x3, _x4, _x5, _x6) {
  return _matchTrack.apply(this, arguments);
}

function _matchTrack() {
  _matchTrack = (0, _asyncToGenerator2.default)(function* (tracks, name, artist, urls) {
    const {
      matches,
      nameMatches
    } = findMatchingTracks(tracks, name, artist, urls);
    let result = [];

    if (matches.length + nameMatches.length === 0) {// TODO: use heuristics to determine possible matches
    } else if (matches.length === 1 || nameMatches.length === 1) {
      result = [matches[0] || nameMatches[0]];
    } else {
      result = matches.length ? matches : nameMatches;
    }

    return result;
  });
  return _matchTrack.apply(this, arguments);
}