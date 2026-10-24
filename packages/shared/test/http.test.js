import { test, expect, vi, afterEach } from 'vitest';
import { getJson, getText } from '../src/services/http.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('getJson adds query parameters and returns parsed JSON', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}'));
  vi.stubGlobal('fetch', fetchMock);
  const data = await getJson('https://api.test/data', { params: { a: 1, list: 'x,y' } });
  expect(data).toEqual({ ok: true });
  expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/data?a=1&list=x%2Cy');
});

test('getText returns the body as text', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<feed/>')));
  expect(await getText('/api/ec-feed?code=06400')).toBe('<feed/>');
});

test('a non-OK response throws with the status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
  await expect(getJson('https://api.test/data')).rejects.toThrow('503');
});

test('a slow request is aborted after the timeout', async () => {
  vi.useFakeTimers();
  // A fetch that only settles when it's aborted
  const neverAnswers = (url, { signal }) =>
    new Promise((_, reject) =>
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    );
  vi.stubGlobal('fetch', vi.fn(neverAnswers));
  const request = getJson('https://api.test/slow', { timeoutMs: 1000 });
  vi.advanceTimersByTime(1000);
  await expect(request).rejects.toThrow('aborted');
});
