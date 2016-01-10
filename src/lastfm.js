/* @flow */

import LastfmAPI from 'lastfmapi';
import promisify from './promisify';
import levenshtein from 'levenshtein-edit-distance';
import fs from 'fs';
import path from 'path';

const lfm = new LastfmAPI({
  'api_key' : 'f21088bf9097b49ad4e7f487abab981e',
  'secret' : '7ccaec2093e33cded282ec7bc81c6fca'
});

const URL_REGEX = /^.+last.fm\/music\/([^/]+)\/[^/]+\/([^/]+)$/;
const LEVENSHTEIN_THRESHOLD = 0.8;

export type TrackInfo = {
  name: string,
  duration: string,
  playcount: string,
  mbid: string,
  url: string,
  artist: {
    name: string,
    mbid: string,
    url: string,
  },
  // streamable, image, @attr are omitted
};

type TopTracksResult = {
  track: Array<TrackInfo>,
  '@attr': {
    user: string,
    page: string,
    perPage: string,
    totalPages: string,
    total: string,
  },
};

export async function getTopTracks(
  user: string,
  useCached: boolean,
): Promise<Array<TrackInfo>> {
  const CACHE_FILE = path.resolve(__dirname, '../cache.json');
  if (useCached) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE).toString());
    } catch (e) {
      // cache doesn't exist; this is normal
    }
  }

  console.log('Fetching play counts from last.fm..')
  let tracks = [];
  for (let page = 1; ; page++) {
    const result: TopTracksResult = await promisify(lfm.user, 'getTopTracks', {
      user,
      limit: 5000, // API per-page limit
      page: page,
    });
    tracks = tracks.concat(result.track);
    const {total} = result['@attr'];
    if (tracks.length >= parseInt(total, 10)) {
      break;
    }
    console.log('Fetching play counts.. (%d/%d)', tracks.length, total)
  }
  // cache results for development purposes
  fs.writeFileSync(CACHE_FILE, JSON.stringify(tracks));
  return tracks;
}

function match(a: ?string, b: ?string): boolean {
  if (a == null || b == null) {
    return true;
  }
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

function tryDecode(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch (e) {}
  return url;
}

function findMatchingTracks(
  tracks: Array<TrackInfo>,
  name: string,
  artist: ?string,
  urls: ?Array<string>,
): {matches: Array<TrackInfo>, nameMatches: Array<TrackInfo>} {
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
      const dist = levenshtein(name, track.name, true);
      const ratio = (name.length - dist) / name.length;
      if (ratio >= LEVENSHTEIN_THRESHOLD) {
        close.push([-ratio, track]);
      }
      nameMatches = close.sort().map(x => x[1]);
    }
  }

  return {matches, nameMatches};
}

function normalizeURL(url: string) {
  const match = URL_REGEX.exec(url);
  if (match == null) {
    console.warn(`warning: invalid URL ${url} in matching.json`);
    return url;
  }
  // The album is never provided by last.fm's API.
  return `http://www.last.fm/music/${match[1]}/_/${match[2]}`;
}

export async function matchTrack(
  tracks: Array<TrackInfo>,
  name: string,
  artist: ?string,
  urls: ?Array<string>,
): Promise<Array<TrackInfo>> {
  const {matches, nameMatches} = findMatchingTracks(
    tracks,
    name,
    artist,
    urls,
  );
  let result = [];
  if (matches.length + nameMatches.length === 0) {
    // TODO: use heuristics to determine possible matches
  } else if (matches.length === 1 || nameMatches.length === 1) {
    result = [matches[0] || nameMatches[0]];
  } else {
    result = matches.length ? matches : nameMatches;
  }
  return result;
}
