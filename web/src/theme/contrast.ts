/**
 * WCAG 2.x contrast helpers (relative luminance and contrast ratio) and a
 * reader for the theme's color tokens. Used by contrast.test.ts so a palette
 * change in src/styles.css cannot silently break the AA contrast the app relies on.
 */

/** WCAG AA minimum contrast for normal text. */
export const AA_NORMAL = 4.5;
/** WCAG AA minimum for large text (18pt, or 14pt bold) and for UI components and graphics (1.4.11). */
export const AA_LARGE = 3;

/** `#rgb` or `#rrggbb` to [r, g, b] (0-255). Throws on anything else. */
export function parseHex(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a hex color: ${JSON.stringify(hex)}`);
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `--color-NAME: #hex;` declarations in a stylesheet, as NAME -> #hex. Only hex values are read. */
export function readThemeColors(css: string): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) colors[m[1]] = m[2].toLowerCase();
  return colors;
}

/** The opaque color of `fg` at `alpha` (0..1) over `bg`, as `#rrggbb`. For checking text over translucent decoration. */
export function blend(fg: string, bg: string, alpha: number): string {
  const [f, b] = [parseHex(fg), parseHex(bg)];
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
