// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { handleBuoyFeedRequest } from '../server/buoyFeedHandler.js';

const FULL_FILE =
  '#YY  MM DD hh mm WDIR WSPD GST  WVHT\n' +
  '#yr  mo dy hr mn degT m/s  m/s     m\n' +
  '2026 10 25 23 00 270  4.0  4.0   0.4\n';

const answer = (body, status = 200) => vi.fn().mockResolvedValue(new Response(body, { status }));

test('rejects ids that are not BC buoys, without fetching anything', async () => {
  const fetchImpl = vi.fn();
  for (const id of ['46999', null, '../x', 'https://evil.example']) {
    expect((await handleBuoyFeedRequest(id, fetchImpl)).status).toBe(400);
  }
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('returns a complete NOAA file with CDN cache headers', async () => {
  const fetchImpl = answer(FULL_FILE);
  const res = await handleBuoyFeedRequest('46146', fetchImpl);
  expect(fetchImpl).toHaveBeenCalledWith('https://www.ndbc.noaa.gov/data/realtime2/46146.txt');
  expect(res).toMatchObject({ status: 200, body: FULL_FILE });
  expect(res.headers['Content-Type']).toBe('text/plain; charset=utf-8');
  expect(res.headers['Cache-Control']).toBe('s-maxage=600, stale-while-revalidate=120');
});

test('incomplete or failed files get an uncached 502', async () => {
  const headerOnly = FULL_FILE.split('\n').slice(0, 2).join('\n');
  const truncated = FULL_FILE.slice(0, 90);
  const cases = [
    answer(headerOnly),
    answer(truncated),
    answer('', 404),
    vi.fn().mockRejectedValue(new Error('down')),
  ];
  for (const fetchImpl of cases) {
    const res = await handleBuoyFeedRequest('46146', fetchImpl);
    expect(res.status).toBe(502);
    expect(res.headers['Cache-Control']).toBe('no-store');
  }
});
