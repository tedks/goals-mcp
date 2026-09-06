export class GoalsApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly context?: unknown) { super(message); }
}

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

/** A single configured origin; tool arguments can never choose a destination. */
export class GoalsApiClient {
  private readonly origin: string;
  constructor(baseUrl: string, private readonly token: string,
    private readonly fetcher: typeof fetch = fetch, private readonly timeoutMs = 15000) {
    let url: URL;
    try { url = new URL(baseUrl); } catch { throw new Error('GOALS_API_URL must be an absolute API origin.'); }
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('GOALS_API_URL must be an HTTPS origin (HTTP is allowed only for loopback), without a path, query or credentials.');
    }
    if (!/^goals_[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('GOALS_API_TOKEN must be a personal access token from Goals Settings.');
    this.origin = url.origin;
  }

  async request(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<Record<string, unknown>> {
    if (!path.startsWith('/api/v1/')) throw new Error('Unsupported Goals API path.');
    const writeHint = ['GET', 'HEAD'].includes(method) ? '' : ' A write may have committed; read its ID before retrying.';
    let response: Response;
    let raw = '';
    try {
      signal?.throwIfAborted();
      response = await this.fetcher(`${this.origin}${path}`, {
        method, redirect: 'error', signal: AbortSignal.any([
          AbortSignal.timeout(this.timeoutMs), ...(signal ? [signal] : []),
        ]),
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let bytes = 0;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_RESPONSE_BYTES) {
              await reader.cancel();
              throw new GoalsApiError(502, 'response_too_large', 'Response exceeds 4 MiB. Use a smaller page or read individual records through the API.');
            }
            raw += decoder.decode(value, { stream: true });
          }
          raw += decoder.decode();
        } finally { reader.releaseLock(); }
      }
    } catch (error) {
      if (error instanceof GoalsApiError) throw error;
      if (signal?.aborted) throw new GoalsApiError(499, 'request_cancelled', `Request cancelled.${writeHint}`);
      // Fetch errors can contain URLs and arbitrary upstream details. Do not echo them.
      throw new GoalsApiError(503, 'connection_failed', `Goals could not be reached or the request timed out.${writeHint}`);
    }
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      data = parsed as Record<string, unknown>;
    } catch {
      throw new GoalsApiError(response.status, 'invalid_response', `Goals returned an unreadable response.${writeHint}`);
    }
    if (!response.ok) {
      throw new GoalsApiError(response.status, typeof data.error === 'string' ? data.error : 'request_failed',
        typeof data.message === 'string' ? data.message : `Goals returned HTTP ${response.status}.`, data.context);
    }
    return data;
  }
}
