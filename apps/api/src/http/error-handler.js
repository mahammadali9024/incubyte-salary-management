/**
 * Maps domain errors to HTTP responses. Anything unexpected becomes a 500 without
 * leaking internals to the client.
 */
// Express identifies error middleware by its four-argument signature.
export function errorHandler(err, _req, res, _next) {
  if (err.statusCode && err.statusCode < 500) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}
