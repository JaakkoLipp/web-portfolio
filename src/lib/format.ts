/* Small pure helpers shared by the build (Astro) and the terminal (browser). */

/* FNV-1a: a stable 32-bit number for a string. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* Stable 7-character hex "commit hash" for an id. */
export const shortHash = (input: string) => fnv1a(input).toString(16).padStart(8, '0').slice(0, 7);

/* https://www.github.com/me/ -> github.com/me */
export const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
