/* @flow */

import invariant from 'assert';
import {getTopTracks} from './lastfm';
import {findDictValue, loadITunesLibrary, saveITunesLibrary} from './itunes';

function idx(x: ?Object, key: string): ?string {
  if (x == null) {
    return null;
  }
  return x[key];
}

function match(a: ?string, b: ?string): boolean {
  if (a == null || b == null) {
    return true;
  }
  return a.toLowerCase() === b.toLowerCase();
}

async function main() {
  try {
    const {path, data} = await loadITunesLibrary();

    const username = process.argv[2];
    invariant(username, 'You must provide a username!');
    const topTracks = await getTopTracks(username);
    console.log('Finished fetching %d play counts.', topTracks.length);

    // Try matching iTunes tracks to last.fm tracks.
    // getTopTracks doesn't give us album info :( but ambiguities are rare.
    // TODO: explicitly fetch album data when this happens.
    const tracks = findDictValue(data.firstChild, 'Tracks');
    invariant(tracks, 'could not get tracks in library');
    for (let i = 0; i < tracks.children.length; i += 2) {
      const dict = tracks.children[i + 1];
      const name = idx(findDictValue(dict, 'Name'), 'val');
      const artist = idx(findDictValue(dict, 'Artist'), 'val');
      const matches = [];
      const nameMatches = [];
      for (const track of topTracks) {
        if (match(track.name, name)) {
          nameMatches.push(track);
          if (match(idx(track.artist, 'name'), artist)) {
            matches.push(track);
          }
        }
      }
      if (matches.length !== 1 && nameMatches.length !== 1) {
        console.log(`warning: could not match ${name}: ${artist}`);
      } else {
        const match = matches[0] || nameMatches[0];
        const playCount = findDictValue(dict, 'Play Count');
        invariant(playCount, 'track has no play count?');
        const myPlayCount = parseInt(playCount.val, 10);
        const matchPlayCount = parseInt(match.playcount, 10);
        if (myPlayCount > matchPlayCount) {
          console.log(
            `warning: ${name}: ${artist}  has more plays locally (%d vs %d)`,
            myPlayCount,
            matchPlayCount,
          );
        } else {
          playCount.val = match.playcount;
        }
      }
    }

    console.log('Saving changes..');
    saveITunesLibrary(path, data);
    console.log('Restart iTunes to see changes.');
  } catch (e) {
    console.error(e);
  }
}

main();
