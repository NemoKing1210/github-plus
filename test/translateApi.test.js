import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const { buildBatches, splitBatchResponse, translateSegments } = await import(
  '../src/features/translate/api.js'
);
const { SEGMENT_START, SEGMENT_END, makeToken } = await import(
  '../src/features/translate/tokens.js'
);
const { cacheKey, setCached, clearCache } = await import(
  '../src/features/translate/cache.js'
);

test('batches keep inline-element tokens for the provider', () => {
  const text = `Read ${makeToken(0)} and ${makeToken(1)}`;
  const batches = buildBatches([{ id: 0, text }]);
  assert.ok(batches[0].text.includes(makeToken(0)));
  assert.ok(batches[0].text.includes(makeToken(1)));
});

test('batches respect the segment and character caps', () => {
  const segments = Array.from({ length: 10 }, (_, id) => ({ id, text: 'hello' }));
  const batches = buildBatches(segments, { maxSegments: 8, maxChars: 1000 });
  assert.equal(batches.length, 2);
  assert.deepEqual(batches[0].ids, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(batches[1].ids, [8, 9]);
});

test('a long segment gets its own batch', () => {
  const batches = buildBatches(
    [{ id: 0, text: 'x'.repeat(10) }, { id: 1, text: 'y'.repeat(10) }],
    { maxSegments: 8, maxChars: 12 },
  );
  assert.equal(batches.length, 2);
});

test('splitBatchResponse maps sentinels back to ids', () => {
  const raw = `${SEGMENT_START}0${SEGMENT_END} Hola ${SEGMENT_START}1${SEGMENT_END} mundo`;
  const out = splitBatchResponse(raw, [0, 1]);
  assert.equal(out.get(0), 'Hola');
  assert.equal(out.get(1), 'mundo');
});

test('splitBatchResponse rejects a missing sentinel', () => {
  assert.equal(splitBatchResponse('Hola mundo', [0, 1]), null);
});

test('translateSegments returns translated segments and reports a dropped sentinel', async () => {
  let calls = 0;
  const translate = async (text) => {
    calls += 1;
    if (calls === 1) return { text: 'broken' };
    return { text: text.toUpperCase(), detectedSourceLang: 'en' };
  };
  const out = await translateSegments(
    [{ id: 0, text: 'one' }, { id: 1, text: 'two' }],
    'ru',
    { translate },
  );
  assert.equal(out.results.get(0).text, 'ONE');
  assert.equal(out.results.get(1).text, 'TWO');
  assert.deepEqual(out.failed, []);
  assert.ok(calls >= 3);
});

test('a segment that keeps failing lands in failed', async () => {
  const translate = async (text) => {
    if (text.includes('bad')) throw new Error('boom');
    return { text: text.toUpperCase(), detectedSourceLang: 'en' };
  };
  const out = await translateSegments(
    [{ id: 0, text: 'good' }, { id: 1, text: 'bad' }],
    'ru',
    { translate },
  );
  assert.equal(out.results.get(0).text, 'GOOD');
  assert.deepEqual(out.failed, [1]);
});

test('progress is reported after every segment settles', async () => {
  const seen = [];
  const out = await translateSegments(
    [{ id: 0, text: 'one' }, { id: 1, text: 'two' }],
    'ru',
    {
      translate: async (text) => ({ text, detectedSourceLang: 'en' }),
      onProgress: (done, total) => seen.push(`${done}/${total}`),
    },
  );
  assert.deepEqual(out.failed, []);
  assert.deepEqual(seen, ['1/2', '2/2']);
});

test('a throttled batch fails without a per-segment retry storm', async () => {
  let calls = 0;
  const translate = async () => {
    calls += 1;
    const error = new Error('quota exceeded');
    error.status = 429;
    throw error;
  };
  const out = await translateSegments(
    [{ id: 0, text: 'one' }, { id: 1, text: 'two' }],
    'ru',
    { translate },
  );
  assert.equal(calls, 1);
  assert.deepEqual(out.failed, [0, 1]);
});

test('a provider that is down stops receiving requests after three failed batches', async () => {
  let calls = 0;
  const translate = async () => {
    calls += 1;
    throw new Error('down');
  };
  const segments = Array.from({ length: 26 }, (_, id) => ({ id, text: `sentence ${id}` }));
  const out = await translateSegments(segments, 'ru', { translate });
  // 26 segments → batches of 8/8/8/2; the first three cost a batch call plus
  // eight per-segment retries, the last batch is rejected without a request.
  assert.equal(calls, 27);
  assert.equal(out.failed.length, 26);
});

test('a cached segment is served without a provider request', async () => {
  setCached(cacheKey('google', 'ru', 'hello'), { text: 'привет', detected: 'en', len: 5 });
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('offline');
  };
  try {
    const out = await translateSegments([{ id: 0, text: 'hello' }], 'ru');
    assert.equal(out.results.get(0).text, 'привет');
    assert.equal(out.failed.length, 0);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    clearCache();
  }
});
