export const MAX_SERIAL_LENGTH = 11;
export const MAX_SERIALS = 100;

function cleanToken(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function expandLongToken(cleaned) {
  const serials = [];
  for (let i = 0; i < cleaned.length; i += MAX_SERIAL_LENGTH) {
    const chunk = cleaned.slice(i, i + MAX_SERIAL_LENGTH);
    if (chunk) serials.push(chunk);
  }
  return serials;
}

/** Parse paste text into unique serials (max 11 chars each). */
export function parseSerials(text) {
  const parts = String(text || '').split(/[\s,;]+/);
  const seen = new Set();
  const serials = [];
  const invalid = [];

  for (const part of parts) {
    const cleaned = cleanToken(part);
    if (!cleaned) continue;

    if (cleaned.length > MAX_SERIAL_LENGTH) {
      // Continuous paste: split every 11 characters
      for (const chunk of expandLongToken(cleaned)) {
        if (chunk.length > MAX_SERIAL_LENGTH) {
          invalid.push(chunk);
          continue;
        }
        if (seen.has(chunk)) continue;
        seen.add(chunk);
        serials.push(chunk);
      }
      continue;
    }

    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    serials.push(cleaned);
  }

  return { serials, invalid };
}

/** Show serials separated by a space (groups of up to 12). */
export function formatSerialText(text) {
  const { serials } = parseSerials(text);
  return serials.join(' ');
}

/** While typing: keep raw-ish but insert a space after every 11 alphanumerics in a run. */
export function formatWhileTyping(text) {
  const lines = String(text || '').split('\n');
  return lines
    .map((line) => {
      // Preserve comma/semicolon separated lists on a line
      if (/[,;]/.test(line)) {
        return line
          .split(/([,;])/)
          .map((seg) => {
            if (seg === ',' || seg === ';') return seg;
            return formatRun(seg);
          })
          .join('');
      }
      return formatRun(line);
    })
    .join('\n');
}

function formatRun(segment) {
  // Split on existing spaces, format each chunk, rejoin with single spaces
  const chunks = segment.split(/(\s+)/);
  return chunks
    .map((chunk) => {
      if (/^\s+$/.test(chunk)) return chunk.length > 0 ? ' ' : '';
      const cleaned = cleanToken(chunk);
      if (!cleaned) return chunk.trim() ? chunk : '';
      if (cleaned.length <= MAX_SERIAL_LENGTH) return cleaned;
      const parts = [];
      for (let i = 0; i < cleaned.length; i += MAX_SERIAL_LENGTH) {
        parts.push(cleaned.slice(i, i + MAX_SERIAL_LENGTH));
      }
      return parts.join(' ');
    })
    .join('')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/^\s+/, '');
}
