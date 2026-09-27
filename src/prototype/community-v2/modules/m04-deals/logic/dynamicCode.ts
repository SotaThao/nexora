/**
 * Demo-only dynamic PIN + QR (doc 04: "Bản mẫu là hash demo — không dùng cho bản thật").
 * A real build uses TOTP (30 s, previous window accepted) and a signed QR token.
 */
export const WINDOW_MS = 30_000;

export function hash32(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const windowIndex = (now = Date.now()) => Math.floor(now / WINDOW_MS);
export const secondsLeftInWindow = (now = Date.now()) => Math.ceil((WINDOW_MS - (now % WINDOW_MS)) / 1000);

export function pinFor(code: string, window = windowIndex()) {
  return String(hash32(`${code}|${window}|pin`) % 1_000_000).padStart(6, "0");
}

/** Accept the current and the previous 30 s window. */
export function pinMatches(code: string, pin: string, now = Date.now()) {
  const w = windowIndex(now);
  return pin === pinFor(code, w) || pin === pinFor(code, w - 1);
}

function finder(grid: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || x < 0 || y >= grid.length || x >= grid.length) continue;
      const ring = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[y][x] = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (ring || core);
    }
  }
}

/** A QR-looking module grid: 3 finder patterns + timing lines + seeded noise. */
export function qrMatrix(seed: string, size = 25) {
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  let x = hash32(seed) || 1;
  const next = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4_294_967_296;
  };
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) grid[r][c] = next() > 0.52;
  }
  for (let i = 8; i < size - 8; i += 1) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }
  finder(grid, 0, 0);
  finder(grid, 0, size - 7);
  finder(grid, size - 7, 0);
  return grid;
}
