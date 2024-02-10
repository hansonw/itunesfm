/* @flow */

export type ITunesTrackInfo = {
  name: string,
  artist: string,
  playedCount: number,
};

export type ITunesTracks = {[id: string]: ITunesTrackInfo};

export type Provider = {
  getTracks: () => Promise<ITunesTracks>;
  updateTracks: (counts: {[id: string]: number}) => Promise<void>;
};
