"use strict";
/* @flow */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopTracks = getTopTracks;
exports.matchTrack = matchTrack;
const lastfmapi_1 = __importDefault(require("lastfmapi"));
const promisify_1 = __importDefault(require("./promisify"));
const levenshtein_edit_distance_1 = __importDefault(require("levenshtein-edit-distance"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lfm = new lastfmapi_1.default({
    api_key: "f21088bf9097b49ad4e7f487abab981e",
    secret: "7ccaec2093e33cded282ec7bc81c6fca",
});
const URL_REGEX = /^.+last.fm\/music\/([^/]+)\/[^/]+\/([^/]+)$/;
const LEVENSHTEIN_THRESHOLD = 0.8;
async function getTopTracks(user, useCached, limit) {
    const CACHE_FILE = path_1.default.resolve(__dirname, "../cache.json");
    if (useCached) {
        try {
            return JSON.parse(fs_1.default.readFileSync(CACHE_FILE).toString());
        }
        catch (e) {
            // cache doesn't exist; this is normal
        }
    }
    console.log("Fetching play counts from last.fm..");
    let tracks = [];
    let pageSize = 1000; // API per-page limit
    for (let page = 1, retries = 0;;) {
        let result = null;
        try {
            result = await (0, promisify_1.default)(lfm.user, "getTopTracks", {
                user,
                limit: pageSize,
                page: page,
            });
            if (result == null || !Array.isArray(result.track)) {
                throw new Error("Invalid response from last.fm");
            }
            retries = 0;
        }
        catch (e) {
            if (pageSize > 500) {
                console.warn("Fetch failed; decreasing page size to 500 and retrying..");
                pageSize = 500;
                page = Math.floor(tracks.length / pageSize) + 1;
            }
            else if (retries < 3) {
                retries++;
                console.warn("Fetch failed; retrying (%d/3)..", retries);
            }
            else {
                throw e;
            }
            await new Promise(r => setTimeout(r, 3000 * retries));
            continue;
        }
        tracks = tracks.concat(result.track);
        const { total } = result["@attr"];
        if ((limit != null && tracks.length >= limit) ||
            tracks.length >= parseInt(total, 10)) {
            break;
        }
        console.log("Fetching play counts.. (%d/%d)", tracks.length, limit != null ? Math.min(limit, parseInt(total, 10)) : total);
        page++;
    }
    if (limit != null) {
        tracks = tracks.slice(0, limit);
    }
    // cache results for development purposes
    fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(tracks));
    return tracks;
}
function match(a, b) {
    if (a == null || b == null) {
        return true;
    }
    return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}
function tryDecode(url) {
    try {
        return decodeURIComponent(url);
    }
    catch (e) { }
    return url;
}
function findMatchingTracks(tracks, name, artist, urls) {
    const matches = [];
    let nameMatches = [];
    for (const track of tracks) {
        if (urls != null) {
            for (const url of urls) {
                if (track.url === url || tryDecode(track.url) === url) {
                    matches.push(track);
                    break;
                }
            }
            continue;
        }
        if (match(track.name, name)) {
            nameMatches.push(track);
            if (match(track.artist.name, artist)) {
                matches.push(track);
            }
        }
    }
    if (urls == null && matches.length + nameMatches.length === 0) {
        // Try Levenshtein distance; return anything > 80%.
        const close = [];
        for (const track of tracks) {
            const dist = (0, levenshtein_edit_distance_1.default)(name, track.name, true);
            const ratio = (name.length - dist) / name.length;
            if (ratio >= LEVENSHTEIN_THRESHOLD) {
                close.push([-ratio, track]);
            }
            nameMatches = close.sort().map((x) => x[1]);
        }
    }
    return { matches, nameMatches };
}
function normalizeURL(url) {
    const match = URL_REGEX.exec(url);
    if (match == null) {
        console.warn(`warning: invalid URL ${url} in matching.json`);
        return url;
    }
    // The album is never provided by last.fm's API.
    return `http://www.last.fm/music/${match[1]}/_/${match[2]}`;
}
async function matchTrack(tracks, name, artist, urls) {
    const { matches, nameMatches } = findMatchingTracks(tracks, name, artist, urls);
    let result = [];
    if (matches.length + nameMatches.length === 0) {
        // TODO: use heuristics to determine possible matches
    }
    else if (matches.length === 1 || nameMatches.length === 1) {
        result = [matches[0] || nameMatches[0]];
    }
    else {
        result = matches.length ? matches : nameMatches;
    }
    return result;
}
