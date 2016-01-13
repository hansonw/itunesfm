# itunesfm

A small script to sync your play counts from [last.fm](http://last.fm) back to iTunes. Supports both Windows and Mac OS X without any native dependencies.

Useful if you scrobble to last.fm from iTunes on multiple computers / devices and want to keep your local play counts consistent.

## Usage

```
npm install -g itunesfm
itunesfm <last.fm username>
```

Potential changes will be displayed in the console, and you will be prompted before anything is actually saved.

Play counts will only be updated if the last.fm play count is **higher** than your local play count.

## Notes

Songs are matched using a fairly naive method:
- First, we look for exact name + artist matches.
- If none exist, we consider exact name matches only.
- If still none exist, consider names with >= 80% similarity (via Levenshtein distance)

It should be pretty easy to improve :)

In the case of ambiguities, you will be prompted for verification: this is then recorded in a `matching.json` file (in `/usr/local/lib/node_modules/itunesfm`) for future script runs.

In the case where songs cannot be matched, you can try modifying `matching.json` manually. You'll notice that the script prints the following:

```
warning: could not match (..song..) (id = <identifier string>)
```

`matching.json` maps the `id` strings to `last.fm` track URLs. Example of a valid mapping (id format varies by platform):

```
{
  "211801203:-536327029":["http://www.last.fm/music/Aimer/_/Last+Stardust"],
  "-1005162388:-866900706":["http://www.last.fm/music/%E3%82%84%E3%81%AA%E3%81%8E%E3%81%AA%E3%81%8E/_/%E6%98%A5%E6%93%AC%E3%81%8D"],
}
```

You can find the URL for a song on last.fm by checking your scrobble history and going to the track page. The format should match the example exactly (`http://www.last.fm/music/<ARTIST>/_/<SONG_NAME>`).

## Making changes

The source files in `src/` are written in ES6/Flow and transpiled with Babel. Make sure you have the development dependencies installed with `npm install` and then run `npm run build` to re-transpile the changes into `bin/`.

Most of the code is type-checked with [Flow](http://flowtype.org/).
