"use strict";
/* @flow */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const path_1 = __importDefault(require("path"));
const SCRIPTS_DIR = path_1.default.resolve(__dirname, '../../scripts');
const WindowsProvider = {
    async getTracks() {
        const proc = child_process_1.default.spawn('wscript.exe', [path_1.default.join(SCRIPTS_DIR, 'win_getTracks.js')]);
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
        const proc = child_process_1.default.spawn('wscript.exe', [path_1.default.join(SCRIPTS_DIR, 'win_updateTracks.js')]);
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
