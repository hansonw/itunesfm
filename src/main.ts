#!/usr/bin/env node
import type { TrackInfo } from "./lastfm";

import fs from "fs";
import os from "os";
import path from "path";
import prompt from "prompt";
import { parseArgs } from "node:util";
import { getTopTracks, matchTrack } from "./lastfm";

prompt.colors = false;

// Store ambiguous songs in this DB.
const MATCHING_FILE = path.resolve(__dirname, "../matching.json");

async function quickPrompt(message: string): Promise<string> {
  while (true) {
    const { result } = await prompt.get({
      properties: { result: { message } },
    });
    if (result) {
      return result;
    }
  }
}

async function promptForMatch(
  name: string | null,
  artist: string | null,
  matches: Array<TrackInfo>
): Promise<Array<TrackInfo>> {
  console.log(
    "Multiple matches for %s by %s. Enter valid numbers (comma separated):",
    name || "??",
    artist || "??"
  );
  for (let i = 0; i < matches.length; i++) {
    console.log(
      "%d: %s by %s (%d plays)",
      i + 1,
      matches[i].name,
      matches[i].artist.name,
      matches[i].playcount
    );
  }
  const reply = await quickPrompt("Enter some numbers (0 for none, a for all)");
  if (reply === "a" || reply === "A") {
    return matches;
  }
  let result: TrackInfo[] = [];
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
    const { values, positionals } = parseArgs({
      options: {
        cache: { type: "boolean" },
        limit: { type: "string" },
        out: { type: "string" },
      },
      allowPositionals: true,
    });

    let provider;
    if (os.platform() === "win32") {
      provider = require("./providers/WindowsProvider.js");
    } else if (os.platform() === "darwin") {
      provider = require("./providers/OSXProvider");
    } else {
      throw new Error(`platform ${os.platform()} not supported`);
    }

    const tracksPromise = provider.getTracks();

    let username = positionals[0];
    if (username == null) {
      username = await quickPrompt("Enter your last.fm username");
    }
    const useCached = values.cache || false;
    const limit = values.limit ? parseInt(values.limit, 10) : undefined;
    const outFile = values.out;

    const topTracks = await getTopTracks(username, useCached, limit);
    if (outFile) {
      fs.writeFileSync(outFile, topTracks.map((t) => JSON.stringify(t)).join("\n"));
      console.log(`Wrote ${topTracks.length} tracks to ${outFile}`);
      return;
    }
    const myTracks = await tracksPromise;

    console.log(
      "Found %d tracks locally, %d on last.fm.",
      Object.keys(myTracks).length,
      topTracks.length
    );

    let matching = {};
    try {
      matching = JSON.parse(fs.readFileSync(MATCHING_FILE).toString());
    } catch (e) {}

    const updates = {};
    for (const id in myTracks) {
      const { name, artist, playedCount } = myTracks[id];
      const urls = matching[id];
      let matches = await matchTrack(topTracks, name, artist, urls);
      if (matches.length === 0) {
        console.warn(
          `warning: could not match ${name} by ${artist} (id = ${id})`
        );
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
    } else {
      const ok = await quickPrompt("Save changes? y/n");
      if (ok === "y") {
        console.log("Saving changes..");
        await provider.updateTracks(updates);
      }
    }

    fs.writeFileSync(MATCHING_FILE, JSON.stringify(matching));
  } catch (e) {
    console.error(e);
  }
}

main();
