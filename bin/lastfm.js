/* @flow */

import LastfmAPI from 'lastfmapi';
import q from 'q';
import fs from 'fs';

const lfm = new LastfmAPI({
  'api_key' : 'f21088bf9097b49ad4e7f487abab981e',
  'secret' : '7ccaec2093e33cded282ec7bc81c6fca'
});

type TrackInfo = {
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

export async function getTopTracks(user: string): Promise<Array<TrackInfo>> {
  const CACHE_FILE = 'cache.json';
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE).toString());
  } catch (e) {
    // cache doesn't exist; this is normal
  }

  console.log('Fetching play counts from last.fm..')
  let tracks = [];
  for (let page = 1; ; page++) {
    const result: TopTracksResult = await q.ninvoke(lfm.user, 'getTopTracks', {
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
  // fs.writeFileSync(CACHE_FILE, JSON.stringify(tracks));
  return tracks;
}
