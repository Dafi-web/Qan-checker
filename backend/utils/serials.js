const MAX_SERIAL_LENGTH = 11;
const MAX_SERIALS = 100;

/** Keep only characters that belong in a serial (digits + letters). */
function cleanToken(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Expand raw paste into individual serials.
 * Continuous digit/letter strings longer than 11 are split every 11 characters.
 * Tokens longer than 12 that can't be cleanly chunked are returned as invalid.
 */
function expandToken(raw) {
  const cleaned = cleanToken(raw);
  if (!cleaned) return { valid: [], invalid: [] };

  if (cleaned.length <= MAX_SERIAL_LENGTH) {
    return { valid: [cleaned], invalid: [] };
  }

  // Auto-split long runs into 12-character serials
  const valid = [];
  for (let i = 0; i < cleaned.length; i += MAX_SERIAL_LENGTH) {
    const chunk = cleaned.slice(i, i + MAX_SERIAL_LENGTH);
    if (chunk.length > 0 && chunk.length <= MAX_SERIAL_LENGTH) {
      valid.push(chunk);
    }
  }
  return { valid, invalid: [] };
}

function parseSerials(text) {
  const parts = String(text || '').split(/[\s,;]+/);
  const seen = new Set();
  const serials = [];
  const tooLong = [];

  for (const part of parts) {
    const cleaned = cleanToken(part);
    if (!cleaned) continue;

    if (cleaned.length > MAX_SERIAL_LENGTH) {
      // Try auto-split first for long continuous paste
      const { valid } = expandToken(cleaned);
      for (const serial of valid) {
        if (seen.has(serial)) continue;
        seen.add(serial);
        serials.push(serial);
      }
      continue;
    }

    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    serials.push(cleaned);
  }

  return { serials, tooLong };
}

/** Format textarea: one serial per group, spaces between 11-digit serials. */
function formatSerialText(text) {
  const { serials } = parseSerials(text);
  return serials.join(' ');
}

function validateSerialLength(serial) {
  const cleaned = cleanToken(serial);
  if (!cleaned) return { ok: false, reason: 'empty' };
  if (cleaned.length > MAX_SERIAL_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  return { ok: true, serial: cleaned };
}

module.exports = {
  MAX_SERIAL_LENGTH,
  MAX_SERIALS,
  cleanToken,
  parseSerials,
  formatSerialText,
  validateSerialLength,
  expandToken,
};
