#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const prompt_1 = __importDefault(require("prompt"));
const lastfm_1 = require("./lastfm");
prompt_1.default.colors = false;
// Store ambiguous songs in this DB.
const MATCHING_FILE = path_1.default.resolve(__dirname, "../matching.json");
async function quickPrompt(message) {
    while (true) {
        const { result } = await prompt_1.default.get({
            properties: { result: { message } },
        });
        if (result) {
            return result;
        }
    }
}
async function promptForMatch(name, artist, matches) {
    console.log("Multiple matches for %s by %s. Enter valid numbers (comma separated):", name || "??", artist || "??");
    for (let i = 0; i < matches.length; i++) {
        console.log("%d: %s by %s (%d plays)", i + 1, matches[i].name, matches[i].artist.name, matches[i].playcount);
    }
    const reply = await quickPrompt("Enter some numbers (0 for none, a for all)");
    if (reply === "a" || reply === "A") {
        return matches;
    }
    let result = [];
    for (const num of reply.split(",")) {
        const match = matches[parseInt(num, 10) - 1];
        if (match != null) {
            result.push(match);
        }
    }
    return result;
}
async function main() {
    try {
        let provider;
        if (os_1.default.platform() === "win32") {
            provider = require("./providers/WindowsProvider.js");
        }
        else if (os_1.default.platform() === "darwin") {
            provider = require("./providers/OSXProvider");
        }
        else {
            throw new Error(`platform ${os_1.default.platform()} not supported`);
        }
        // Start fetching from iTunes immediately.
        const tracksPromise = provider.getTracks();
        let username = process.argv[2];
        if (username == null) {
            username = await quickPrompt("Enter your last.fm username");
        }
        const useCached = process.argv.indexOf("cache") !== -1;
        const topTracks = await (0, lastfm_1.getTopTracks)(username, useCached);
        const myTracks = await tracksPromise;
        console.log("Found %d tracks locally, %d on last.fm.", Object.keys(myTracks).length, topTracks.length);
        let matching = {};
        try {
            matching = JSON.parse(fs_1.default.readFileSync(MATCHING_FILE).toString());
        }
        catch (e) { }
        const updates = {};
        for (const id in myTracks) {
            const { name, artist, playedCount } = myTracks[id];
            const urls = matching[id];
            let matches = await (0, lastfm_1.matchTrack)(topTracks, name, artist, urls);
            if (matches.length === 0) {
                console.warn(`warning: could not match ${name} by ${artist} (id = ${id})`);
                if (urls != null) {
                    console.warn("additionally, you provided urls but none matched");
                }
                continue;
            }
            if (urls == null && matches.length > 1) {
                matches = await promptForMatch(name, artist, matches);
                matching[id] = matches.map((x) => x.url);
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
            console.log("No play counts were changed.");
        }
        else {
            const ok = await quickPrompt("Save changes? y/n");
            if (ok === "y") {
                console.log("Saving changes..");
                await provider.updateTracks(updates);
            }
        }
        fs_1.default.writeFileSync(MATCHING_FILE, JSON.stringify(matching));
    }
    catch (e) {
        console.error(e);
    }
}
main();
