/* @flow */

import type {ITunesTrackInfo, Provider} from './Provider';

import child_process from 'child_process';
import path from 'path';

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');

const WindowsProvider: Provider = {
  async getTracks() {
    const proc = child_process.spawn('wscript.exe', [path.join(SCRIPTS_DIR, 'win_getTracks.js')]);
    let stdout = '';
    proc.stdout.on('data', (data) => {
      stdout += data;
    });
    return new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`getTracks failed with code ${code}`));
        }
        resolve(JSON.parse(decodeURIComponent(stdout)));
      });
    });
  },

  async updateTracks(counts) {
    const proc = child_process.spawn('wscript.exe', [path.join(SCRIPTS_DIR, 'win_updateTracks.js')]);
    proc.stdin.write(encodeURIComponent(JSON.stringify(counts)) + '\n');
    let stdout = '';
    proc.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    return new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`updateTracks failed with code ${code}`));
        }
        resolve();
      });
    });
  },
};

module.exports = WindowsProvider;
