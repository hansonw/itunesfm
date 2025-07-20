import type { ITunesTrackInfo, Provider } from "./Provider";

import { execFile } from "child_process";

const MAX_BUFFER = 1024 * 1024 * 1024; // Track output can be very large

function Application(app: string): any {} // stub for Flow

function osaPromise(fn, ...args): any {
  return new Promise((resolve, reject) => {
    const jsonArgs = args.map((a) => JSON.stringify(a)).join(',');
    const functionCall = `JSON.stringify((${fn.toString()})(${jsonArgs}))`;
    const lines = functionCall.replace(/^\s+/g, ' ').replace(/'/g, "'\\''").split('\n');
    const params = ['-l', 'JavaScript'];
    for (const line of lines) {
      params.push('-e', line);
    }
    execFile('osascript', params, { maxBuffer: MAX_BUFFER }, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        if (stdout.trim() === '') {
          resolve(undefined);
        } else {
          resolve(JSON.parse(stdout));
        }
      } catch (e) {
        reject(new Error('Function did not return an object: ' + e.message));
      }
    });
  });
}

const OSXProvider: Provider = {
  async getTracks() {
    return await osaPromise(() => {
      var itunes = Application('Music');
      var tracks = itunes.libraryPlaylists[0].tracks;
      var result = {};
      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        result[track.persistentID()] = {
          name: track.name(),
          artist: track.artist(),
          playedCount: track.playedCount()
        };
      }
      return result;
    });
  },

  async updateTracks(counts) {
    await osaPromise((counts) => {
      var itunes = Application('Music');
      var tracks = itunes.libraryPlaylists[0].tracks;
      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var id = track.persistentID();
        if (counts[id]) {
          track.playedCount = counts[id];
        }
      }
    }, counts);
  },
};

module.exports = OSXProvider;
