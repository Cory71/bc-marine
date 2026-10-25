// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { handleEcFeedRequest } from '../server/ecFeedHandler.js';

test('rejects unknown codes with 400 and never fetches', async () => {
  const fetchImpl = vi.fn();
  expect((await handleEcFeedRequest('99999', fetchImpl)).status).toBe(400);
  expect((await handleEcFeedRequest(null, fetchImpl)).status).toBe(400);
  expect((await handleEcFeedRequest('../etc/passwd', fetchImpl)).status).toBe(400);
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('returns XML with CDN cache headers', async () => {
  const feed = '<feed><entry/></feed>\n';
  const fetchImpl = vi.fn().mockResolvedValue(new Response(feed, { status: 200 }));
  const res = await handleEcFeedRequest('06400', fetchImpl);
  expect(fetchImpl).toHaveBeenCalledWith('https://weather.gc.ca/rss/marine/06400_e.xml');
  expect(res).toMatchObject({ status: 200, body: feed });
  expect(res.headers['Content-Type']).toBe('application/xml; charset=utf-8');
  expect(res.headers['Cache-Control']).toBe('s-maxage=600, stale-while-revalidate=120');
});

test('maps upstream failure to 502', async () => {
  expect((await handleEcFeedRequest('06400', vi.fn().mockRejectedValue(new Error('down')))).status).toBe(502);
  expect((await handleEcFeedRequest('06400', vi.fn().mockResolvedValue(new Response('', { status: 503 })))).status).toBe(502);
});

test('a half-written feed is rejected and not cached', async () => {
  // EC was mid-update: the file stops partway through a tag
  const truncated = '<feed><entry><id>tag:weather.gc.ca,2013-04-16:14305</i';
  const res = await handleEcFeedRequest(
    '14300',
    vi.fn().mockResolvedValue(new Response(truncated, { status: 200 }))
  );
  expect(res.status).toBe(502);
  expect(res.headers['Cache-Control']).toBe('no-store');
});

test('RSS 2.0 feeds are accepted too', async () => {
  const rss = '<rss version="2.0"><channel></channel></rss>';
  const res = await handleEcFeedRequest('06400', vi.fn().mockResolvedValue(new Response(rss)));
  expect(res.status).toBe(200);
});
