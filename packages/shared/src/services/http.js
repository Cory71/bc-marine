// Small wrapper around the built-in fetch (no axios needed in browsers or React Native)

// Give up on slow requests so a screen never hangs waiting for one API
const DEFAULT_TIMEOUT_MS = 15000;

// GET a URL and return its JSON body
export async function getJson(url, options) {
  const response = await request(url, options);
  return response.json();
}

// GET a URL and return its body as text (used for XML feeds)
export async function getText(url, options) {
  const response = await request(url, options);
  return response.text();
}

// Send the request with optional query params and a timeout; throw on non-2xx answers
async function request(url, { params, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status}): ${fullUrl}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}
