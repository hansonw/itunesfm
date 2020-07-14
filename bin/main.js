#!/usr/bin/env node
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _assert = _interopRequireDefault(require("assert"));

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _prompt = _interopRequireDefault(require("prompt"));

var _promisify = _interopRequireDefault(require("./promisify"));

var _lastfm = require("./lastfm");

_prompt.default.colors = false; // Store ambiguous songs in this DB.

const MATCHING_FILE = _path.default.resolve(__dirname, '../matching.json');

function quickPrompt(_x) {
  return _quickPrompt.apply(this, arguments);
}

function _quickPrompt() {
  _quickPrompt = (0, _asyncToGenerator2.default)(function* (message) {
    while (true) {
      const {
        result
      } = yield (0, _promisify.default)(_prompt.default, 'get', {
        properties: {
          result: {
            message
          }
        }
      });

      if (result) {
        return result;
      }
    }

    return ''; // for Flow
  });
  return _quickPrompt.apply(this, arguments);
}

function promptForMatch(_x2, _x3, _x4) {
  return _promptForMatch.apply(this, arguments);
}

function _promptForMatch() {
  _promptForMatch = (0, _asyncToGenerator2.default)(function* (name, artist, matches) {
    console.log('Multiple matches for %s by %s. Enter valid numbers (comma separated):', name || '??', artist || '??');

    for (let i = 0; i < matches.length; i++) {
      console.log('%d: %s by %s (%d plays)', i + 1, matches[i].name, matches[i].artist.name, matches[i].playcount);
    }

    const reply = yield quickPrompt('Enter some numbers (0 for none, a for all)');

    if (reply === 'a' || reply === 'A') {
      return matches;
    }

    let result = [];

    for (const num of reply.split(',')) {
      const match = matches[parseInt(num, 10) - 1];

      if (match != null) {
        result.push(match);
      }
    }

    return result;
  });
  return _promptForMatch.apply(this, arguments);
}

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = (0, _asyncToGenerator2.default)(function* () {
    try {
      let provider;

      if (_os.default.platform() === 'win32') {
        provider = require('./providers/WindowsProvider.js');
      } else if (_os.default.platform() === 'darwin') {
        provider = require('./providers/OSXProvider');
      } else {
        throw new Error(`platform ${_os.default.platform()} not supported`);
      } // Start fetching from iTunes immediately.


      const tracksPromise = provider.getTracks();
      let username = process.argv[2];

      if (username == null) {
        username = yield quickPrompt('Enter your last.fm username');
      }

      const useCached = process.argv.indexOf('cache') !== -1;
      const topTracks = yield (0, _lastfm.getTopTracks)(username, useCached);
      const myTracks = yield tracksPromise;
      console.log('Found %d tracks locally, %d on last.fm.', Object.keys(myTracks).length, topTracks.length);
      let matching = {};

      try {
        matching = JSON.parse(_fs.default.readFileSync(MATCHING_FILE).toString());
      } catch (e) {}

      const updates = {};

      for (const id in myTracks) {
        const {
          name,
          artist,
          playedCount
        } = myTracks[id];
        const urls = matching[id];
        let matches = yield (0, _lastfm.matchTrack)(topTracks, name, artist, urls);

        if (matches.length === 0) {
          console.warn(`warning: could not match ${name} by ${artist} (id = ${id})`);

          if (urls != null) {
            console.warn('additionally, you provided urls but none matched');
          }

          continue;
        }

        if (urls == null && matches.length > 1) {
          matches = yield promptForMatch(name, artist, matches);
          matching[id] = matches.map(x => x.url);
        }

        let matchPlayCount = 0;

        for (const match of matches) {
          matchPlayCount += parseInt(match.playcount, 10);
        }

        if (playedCount < matchPlayCount) {
          console.log(`will update ${name}: ${artist} to ${matchPlayCount}`);
          updates[id] = matchPlayCount;
        }
      }

      if (Object.keys(updates).length === 0) {
        console.log('No play counts were changed.');
      } else {
        const ok = yield quickPrompt('Save changes? y/n');

        if (ok === 'y') {
          console.log('Saving changes..');
          yield provider.updateTracks(updates);
        }
      }

      _fs.default.writeFileSync(MATCHING_FILE, JSON.stringify(matching));
    } catch (e) {
      console.error(e);
    }
  });
  return _main.apply(this, arguments);
}

main();