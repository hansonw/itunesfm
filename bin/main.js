/* @flow */

import type {TrackInfo} from './lastfm';

import invariant from 'assert';
import fs from 'fs';
import os from 'os';
import prompt from 'prompt';
import q from 'q';
import {getTopTracks, findMatchingTracks} from './lastfm';
import {findDictValue, loadITunesLibrary, saveITunesLibrary} from './itunesxml';

prompt.colors = false;

// Store ambiguous songs in this DB.
const MATCHING_FILE = 'matching.json';

function idx(x: ?Object, key: string): ?string {
  if (x == null) {
    return null;
  }
  return x[key];
}

async function quickPrompt(message: string): Promise<string> {
  const {result} = await q.ninvoke(prompt, 'get', {properties: {result: {message}}});
  return result;
}

async function promptForMatch(name: ?string, artist: ?string, matches: Array<TrackInfo>) {
  console.log(
    'Multiple matches for %s by %s. Please pick one:',
    name || '??',
    artist || '??',
  );
  for (let i = 0; i < matches.length; i++) {
    console.log(
      '%d: %s by %s (%d plays)',
      i + 1,
      matches[i].name,
      matches[i].artist.name,
      matches[i].playcount,
    );
  }
  const num = parseInt(await quickPrompt('Enter a number (0 for none)'), 10);
  if (num <= 0 || num >= matches.length) {
    return null;
  }
  return matches[num - 1];
}

async function matchTrack(
  tracks: Array<TrackInfo>,
  name: ?string,
  artist: ?string,
  key: ?string,
  matching: Object,
) {
  const {matches, nameMatches} = findMatchingTracks(
    tracks,
    name,
    artist,
    key && matching[key],
  );
  let match;
  if (matches.length + nameMatches.length === 0) {
    console.log(`warning: could not match ${name}: ${artist}`);
  } else if (matches.length === 1 || nameMatches.length === 1) {
    match = matches[0] || nameMatches[0];
  } else {
    match = await promptForMatch(name, artist, matches.length ? matches : nameMatches);
    if (match != null && key) {
      matching[key] = match.url;
    }
  }
  return match;
}

async function main() {
  try {
    let username = process.argv[2];
    if (username == null) {
      username = await quickPrompt('Enter your last.fm username');
    }
    const useCached = process.argv.indexOf('cache') !== -1;
    const topTracks = await getTopTracks(username, useCached);
    console.log('Finished fetching %d play counts.', topTracks.length);

    let matching = {};
    try {
      matching = JSON.parse(fs.readFileSync(MATCHING_FILE).toString());
    } catch (e) {}

    try {
      if (os.platform() === 'win32') {
        const win32ole = require('win32ole');
        const iTunesApp = win32ole.client.Dispatch('iTunes.Application');
        const tracks = iTunesApp.LibraryPlaylist().Tracks();
        for (let i = 1; i <= tracks.Count(); i++) {
          const track = tracks.Item(i);
          const name = track.Name();
          const artist = track.Artist();
          const key = iTunesApp.ITObjectPersistentIDHigh(track).toString();
          const match = await matchTrack(topTracks, name, artist, key, matching);
          if (match != null) {
            const myPlayCount = track.PlayedCount();
            const matchPlayCount = parseInt(match.playcount, 10);
            if (myPlayCount < matchPlayCount) {
              console.log(`up ${name}: ${myPlayCount} -> ${matchPlayCount}`);
              track.PlayedCount = matchPlayCount;
            }
          }
        }
      } else {
        throw new Error('not implemented');
      }
    } catch (e) {
      console.log('Native API failed. Falling back to loading XML files.');
      // Try matching iTunes tracks to last.fm tracks.
      // getTopTracks doesn't give us album info :( but ambiguities are rare.
      // TODO: explicitly fetch album data when this happens.
      const {path, data} = await loadITunesLibrary();
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
        const key = idx(findDictValue(dict, 'Location'), 'val');
        const match = await matchTrack(topTracks, name, artist, key, matching);
        if (match != null) {
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
      if (ok === 'y') {
        console.log('Saving changes..');
        saveITunesLibrary(path, data);
        console.log('Restart iTunes to see changes.');
      }
    }

    fs.writeFileSync(MATCHING_FILE, JSON.stringify(matching));
  } catch (e) {
    console.error(e);
  }
}

main();
