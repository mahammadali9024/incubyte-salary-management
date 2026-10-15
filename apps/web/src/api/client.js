/** Error carrying the HTTP status and the JSON body the API returned. */
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

/** Builds a query string, dropping empty values. */
export function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

async function request(method, path, { body, query } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${path}${toQuery(query)}`, {
    method,
    credentials: 'same-origin',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body && !isForm ? JSON.stringify(body) : body,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body, query) => request('POST', path, { body, query }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path) => request('DELETE', path),
};

/** URL for a file download (export/template) — opened by the browser so cookies apply. */
export const downloadUrl = (path, query) => `/api${path}${toQuery(query)}`;
