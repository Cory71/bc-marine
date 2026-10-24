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
  const fetchImpl = vi.fn().mockResolvedValue(new Response('<feed/>', { status: 200 }));
  const res = await handleEcFeedRequest('06400', fetchImpl);
  expect(fetchImpl).toHaveBeenCalledWith('https://weather.gc.ca/rss/marine/06400_e.xml');
  expect(res).toMatchObject({ status: 200, body: '<feed/>' });
  expect(res.headers['Content-Type']).toBe('application/xml; charset=utf-8');
  expect(res.headers['Cache-Control']).toBe('s-maxage=1800, stale-while-revalidate=600');
});

test('maps upstream failure to 502', async () => {
  expect((await handleEcFeedRequest('06400', vi.fn().mockRejectedValue(new Error('down')))).status).toBe(502);
  expect((await handleEcFeedRequest('06400', vi.fn().mockResolvedValue(new Response('', { status: 503 })))).status).toBe(502);
});
