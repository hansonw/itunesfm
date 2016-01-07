/* @flow */

import invariant from 'assert';
import prompt from 'prompt';
import q from 'q';
import {getTopTracks} from './lastfm';
import {findDictValue, loadITunesLibrary, saveITunesLibrary} from './itunes';

prompt.colors = false;

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

async function quickPrompt(message: string): Promise<string> {
  const {result} = await q.ninvoke(prompt, 'get', {properties: {result: {message}}});
  return result;
}

async function main() {
  try {
    const {path, data} = await loadITunesLibrary();

    let username = process.argv[2];
    if (username == null) {
      username = await quickPrompt('Enter your last.fm username');
    }
    const topTracks = await getTopTracks(username);
    console.log('Finished fetching %d play counts.', topTracks.length);

    // Try matching iTunes tracks to last.fm tracks.
    // getTopTracks doesn't give us album info :( but ambiguities are rare.
    // TODO: explicitly fetch album data when this happens.
    const tracks = findDictValue(data.firstChild, 'Tracks');
    invariant(tracks, 'could not get tracks in library');
    for (let i = 0; i < tracks.children.length; i += 2) {
      const dict = tracks.children[i + 1];
      const kind = idx(findDictValue(dict, 'Kind'), 'val');
      if (kind == null || kind.indexOf('audio file') === -1) {
        continue;
      }

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
        if (playCount == null) {
          console.log(`skipping ${name}: ${artist} due to no play count`);
          // TODO: add a play count entry!
          continue;
        }
        const myPlayCount = parseInt(playCount.val, 10);
        const matchPlayCount = parseInt(match.playcount, 10);
        if (myPlayCount < matchPlayCount) {
          // console.log(`updating ${name}: ${artist} to ${match.playcount}`);
          playCount.val = match.playcount;
        }
      }
    }

    const ok = await quickPrompt('Save changes? y/n');
    if (ok !== 'y') {
      return;
    }

    console.log('Saving changes..');
    saveITunesLibrary(path, data);
    console.log('Restart iTunes to see changes.');
  } catch (e) {
    console.error(e);
  }
}

main();
