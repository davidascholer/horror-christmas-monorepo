// @vitest-environment node
/**
 * Contrast guard for the site palette. Reads the real color tokens from
 * src/styles.css and checks every foreground/background pair the app uses
 * against WCAG AA. The same pairs are listed in web/README.md.
 *
 * If you start using a new pair in a component, add it to USED_PAIRS here and
 * to the README table.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AA_LARGE, AA_NORMAL, blend, contrastRatio, parseHex, readThemeColors, relativeLuminance } from './contrast';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const colors = readThemeColors(css);

type Level = 'normal' | 'large';

interface Pair {
  fg: string;
  bg: string;
  /** What it is used for. */
  use: string;
  /** normal = body-size text (4.5:1). large = large text, UI components, borders, decoration (3:1). */
  level: Level;
}

const USED_PAIRS: Pair[] = [
  { fg: 'bone', bg: 'ink', use: 'body text on the page', level: 'normal' },
  { fg: 'bone', bg: 'surface', use: 'brand name, footer, header text', level: 'normal' },
  { fg: 'bone', bg: 'raised', use: 'inline code', level: 'normal' },
  { fg: 'bone-muted', bg: 'ink', use: 'secondary text, labels', level: 'normal' },
  { fg: 'bone-muted', bg: 'surface', use: 'footer text', level: 'normal' },
  { fg: 'slime', bg: 'ink', use: 'links, skip link', level: 'normal' },
  { fg: 'slime', bg: 'surface', use: 'navigation links', level: 'normal' },
  { fg: 'slime-soft', bg: 'ink', use: 'link hover', level: 'normal' },
  { fg: 'slime-soft', bg: 'surface', use: 'navigation link hover', level: 'normal' },
  { fg: 'blood-glow', bg: 'ink', use: 'red text and list markers on the page', level: 'normal' },
  { fg: 'blood-glow', bg: 'surface', use: 'brand hover', level: 'normal' },
  { fg: 'bone', bg: 'blood', use: 'button label on a blood-red button', level: 'normal' },
  { fg: 'bone', bg: 'blood-deep', use: 'button label, pressed state', level: 'normal' },
  { fg: 'slime', bg: 'ink', use: 'focus ring (UI component, 3:1)', level: 'large' },
  { fg: 'slime', bg: 'surface', use: 'focus ring on header and footer (3:1)', level: 'large' },
  { fg: 'blood', bg: 'ink', use: 'red borders, rules, large decorative text', level: 'large' },
  // Homepage (Task 7.1): cards sit on surface (page) or ink (inside the surface-colored seasonal band).
  { fg: 'bone-muted', bg: 'raised', use: 'broken-image alt text in the card image area', level: 'normal' },
  { fg: 'bone', bg: 'surface', use: 'card title', level: 'normal' },
  { fg: 'bone-muted', bg: 'surface', use: 'card summary', level: 'normal' },
  { fg: 'blood-glow', bg: 'surface', use: 'card label, seasonal band background', level: 'normal' },
  { fg: 'slime-soft', bg: 'surface', use: 'card title on hover', level: 'normal' },
  { fg: 'bone', bg: 'ink', use: 'card title inside the seasonal band, hero headline and intro', level: 'normal' },
  { fg: 'bone-muted', bg: 'ink', use: 'card summary inside the seasonal band', level: 'normal' },
  { fg: 'blood-glow', bg: 'ink', use: 'card label inside the seasonal band, hero eyebrow', level: 'normal' },
  { fg: 'slime-soft', bg: 'ink', use: 'card title on hover inside the seasonal band', level: 'normal' },
  { fg: 'slime', bg: 'ink', use: 'hero "One Home." (large text) and card focus border', level: 'normal' },
  { fg: 'blood-glow', bg: 'surface', use: 'card hover border (UI component, 3:1)', level: 'large' },
  { fg: 'slime', bg: 'surface', use: 'card focus border (UI component, 3:1)', level: 'large' },
];

const need = (level: Level) => (level === 'normal' ? AA_NORMAL : AA_LARGE);

describe('theme tokens', () => {
  it('defines every color the pairs use, as hex', () => {
    for (const name of new Set(USED_PAIRS.flatMap((p) => [p.fg, p.bg]))) {
      expect(colors[name], `--color-${name}`).toBeDefined();
    }
  });

  it('page background is the near-black ink', () => {
    expect(colors.ink).toBe('#0a0a0b');
    expect(relativeLuminance(colors.ink)).toBeLessThan(0.01);
  });
});

describe('WCAG contrast of the pairs the app uses', () => {
  for (const pair of USED_PAIRS) {
    it(`${pair.fg} on ${pair.bg} (${pair.use}) reaches ${need(pair.level)}:1`, () => {
      expect(contrastRatio(colors[pair.fg], colors[pair.bg])).toBeGreaterThanOrEqual(need(pair.level));
    });
  }

  it('plain blood red on ink is for large text and decoration only: it passes 3:1 but not 4.5:1', () => {
    const ratio = contrastRatio(colors.blood, colors.ink);
    expect(ratio).toBeGreaterThanOrEqual(AA_LARGE);
    expect(ratio).toBeLessThan(AA_NORMAL);
  });
});

describe('hero background (Task 7.1)', () => {
  // The hero text sits on ink, with the atmosphere in styles.css on top: a blood-deep glow (up to 30%), a blood
  // glow (up to 22%), a slime-deep glow (up to 26%), a surface gradient and snow specks. Test the brightest
  // plausible mix of the glows over ink; text must stay AA there. The values mirror .hero-atmosphere / .hero-glow.
  const worst = blend(colors.blood, blend(colors['blood-deep'], colors.ink, 0.3), 0.22);
  it('bone (headline, intro) stays AA on the brightest part of the red glow', () => {
    expect(contrastRatio(colors.bone, worst)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it('blood-glow (eyebrow) and slime ("One Home.", large) stay readable on the brightest part of the red glow', () => {
    expect(contrastRatio(colors['blood-glow'], worst)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(colors.slime, worst)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it('bone on the green glow and on a snow speck (bone at 70% over ink, 3px, decoration) stays above 3:1', () => {
    expect(contrastRatio(colors.bone, blend(colors['slime-deep'], colors.ink, 0.26))).toBeGreaterThanOrEqual(AA_NORMAL);
    // A speck is at most a few pixels wide; where it passes behind a letter the pair is bone-muted/bone on a light dot.
    expect(contrastRatio(colors.bone, blend(colors.bone, colors.ink, 0.7 * 0.55))).toBeGreaterThanOrEqual(AA_LARGE);
  });
  it('the strengths used above are the ones in styles.css (raise them there and this test fails until the contrast is re-checked)', () => {
    expect(css).toContain('var(--color-blood-deep) 30%');
    expect(css).toContain('var(--color-blood) 22%');
    expect(css).toContain('var(--color-slime-deep) 26%');
  });
  it('the blend helper is exact at the ends', () => {
    expect(blend('#ffffff', '#000000', 0)).toBe('#000000');
    expect(blend('#ffffff', '#000000', 1)).toBe('#ffffff');
    expect(blend('#ff0000', '#0000ff', 0.5)).toBe('#800080');
  });
});

describe('contrast helpers', () => {
  it('match the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(parseHex('#abc')).toEqual([0xaa, 0xbb, 0xcc]);
    expect(() => parseHex('red')).toThrow(/Not a hex color/);
  });
});
