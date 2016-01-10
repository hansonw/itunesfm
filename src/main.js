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

function optionalRequire(module: string): any {
  // $FlowIssue: unsafe way to require an optional module.
  return require(module);
}

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
    console.log(`warning: could not match ${name} by ${artist}`);
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
        const win32ole = optionalRequire('win32ole');
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
              console.log(`updating ${name}: ${artist} to ${match.playcount}`);
              track.PlayedCount = matchPlayCount;
            }
          }
        }
      } else if (os.platform() === 'darwin') {
        function Application(): any {} // stub for Flow
        const osa = optionalRequire('osa');
        const osaPromise = (fn, ...args) => {
          return new Promise((resolve, reject) => {
            osa(fn, ...args, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        };
        const tracks = await osaPromise(() => {
          var itunes = Application('iTunes');
          var tracks = itunes.libraryPlaylists[0].tracks;
          var result = [];
          for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            if (track.videoKind() !== 'none') {
              continue;
            }
            result.push({
              id: track.persistentID(),
              name: track.name(),
              artist: track.artist(),
              playedCount: track.playedCount(),
            });
          }
          return result;
        });
        const updates = {};
        for (const track of tracks) {
          const {id, name, artist, playedCount} = track;
          const match = await matchTrack(topTracks, name, artist, id, matching);
          if (match != null) {
            const matchPlayCount = parseInt(match.playcount, 10);
            if (playedCount < matchPlayCount) {
              console.log(`updating ${name}: ${artist} to ${match.playcount}`);
              updates[id] = matchPlayCount;
            }
          }
        }
        await osaPromise((counts) => {
          var itunes = Application('iTunes');
          var tracks = itunes.libraryPlaylists[0].tracks;
          for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var id = track.persistentID();
            if (counts[id]) {
              track.playedCount = counts[id];
            }
          }
        }, updates);
      } else {
        throw new Error('not implemented');
      }
    } catch (e) {
      console.log('Native API failed. Falling back to loading XML files.', e);
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
            console.log(`updating ${name}: ${artist} to ${match.playcount}`);
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
