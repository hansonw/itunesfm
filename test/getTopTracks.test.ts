import { test } from 'node:test';
import assert from 'assert';
import nock from 'nock';
import { getTopTracks } from '../src/lastfm';

test('retries with smaller page size on failure', async () => {
  const scope1 = nock('http://ws.audioscrobbler.com')
    .get('/2.0')
    .query((q) => q.method === 'user.getTopTracks' && q.limit === '1000')
    .replyWithError('boom');

  const track = {
    name: 'Song',
    duration: '100',
    playcount: '1',
    mbid: 'mb',
    url: 'http://www.last.fm/music/a/_/Song',
    artist: { name: 'a', mbid: '', url: 'http://www.last.fm/music/a' },
  };

  const scope2 = nock('http://ws.audioscrobbler.com')
    .get('/2.0')
    .query((q) => q.method === 'user.getTopTracks' && q.limit === '500')
    .reply(200, {
      toptracks: {
        track: [track],
        '@attr': {
          user: 'test',
          page: '1',
          perPage: '500',
          totalPages: '1',
          total: '1',
        },
      },
    });

  const result = await getTopTracks('test', false, 1);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'Song');
  scope1.done();
  scope2.done();
});
