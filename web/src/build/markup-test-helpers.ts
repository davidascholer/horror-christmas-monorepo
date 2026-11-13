/**
 * Strict HTML/XML parsing helpers for the black-box output tests (Task 6.6).
 * Test support only: no dependency, built for the output React and the
 * sitemap writer actually produce, and deliberately intolerant. Anything a
 * browser or crawler would have to "recover" from (unclosed or mismatched
 * tags, unquoted attributes, stray `<`, `>` or bare `&`, duplicate
 * attributes, comments) throws, so a malformed page fails a test.
 *
 * One deliberate exception: React's text separator `<!-- -->` (written by
 * renderToString between adjacent text nodes so the browser can hydrate) is
 * accepted in HTML mode and skipped. Any other comment still throws.
 */
export interface MNode {
  name: string;
  attrs: Record<string, string>;
  children: Array<MNode | string>;
  parent: MNode | null;
}
export interface ParsedMarkup {
  root: MNode;
  /** The leading `<!doctype ...>` or `<?xml ...?>` text, if any. */
  prolog: string | null;
}
const VOID = new Set(['meta', 'link', 'img', 'source', 'br', 'hr', 'input', 'area', 'base', 'col', 'embed', 'track', 'wbr']);
const RAW_TEXT = new Set(['script', 'style']);
const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const ENTITY = /&(?:(amp|lt|gt|quot|apos)|#(\d+)|#x([0-9a-fA-F]+));/g;
/** Decodes the entities React and the XML writer emit; throws on any other `&`. */
export function decodeEntities(value: string): string {
  const decoded = value.replace(ENTITY, (_m, named?: string, dec?: string, hex?: string) =>
    named ? NAMED[named] : String.fromCodePoint(dec ? Number(dec) : parseInt(hex as string, 16)),
  );
  // After decoding, any `&` that remains must have come from a decoded `&amp;`; re-check the raw text instead.
  if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(value)) {
    throw new Error(`Bare or unknown entity in ${JSON.stringify(value.slice(0, 80))}`);
  }
  return decoded;
}
const ATTR = /\s+([^\s"'<>/=]+)(?:=(?:"([^"]*)"|'([^']*)'))?/y;
export function parseMarkup(src: string, mode: 'html' | 'xml'): ParsedMarkup {
  const root: MNode = { name: '#root', attrs: {}, children: [], parent: null };
  let current = root;
  let pos = 0;
  let prolog: string | null = null;
  const fail = (msg: string): never => {
    throw new Error(`${mode.toUpperCase()} parse error at ${pos}: ${msg} near ${JSON.stringify(src.slice(pos, pos + 60))}`);
  };
  const pushText = (raw: string, rawText = false) => {
    if (raw === '') return;
    if (!rawText && /[<>]/.test(raw)) fail('unescaped < or > in text');
    current.children.push(rawText ? raw : decodeEntities(raw));
  };
  if (mode === 'xml') {
    const decl = /^<\?xml [^>]*\?>\n?/.exec(src);
    if (!decl) fail('missing XML declaration');
    else {
      prolog = decl[0].trim();
      pos = decl[0].length;
    }
  } else {
    const dt = /^<!doctype html>/i.exec(src);
    if (dt) {
      prolog = dt[0];
      pos = dt[0].length;
    }
  }
  while (pos < src.length) {
    const lt = src.indexOf('<', pos);
    if (lt === -1) {
      pushText(src.slice(pos));
      pos = src.length;
      break;
    }
    pushText(src.slice(pos, lt));
    pos = lt;
    if (mode === 'html' && src.startsWith('<!-- -->', pos)) {
      pos += '<!-- -->'.length;
      continue;
    }
    if (src.startsWith('<!--', pos)) fail('comment');
    if (src.startsWith('<!', pos) || src.startsWith('<?', pos)) fail('unexpected declaration');
    if (src.startsWith('</', pos)) {
      const m = /^<\/([a-zA-Z][\w:-]*)\s*>/.exec(src.slice(pos, pos + 200));
      if (!m) return fail('malformed closing tag');
      if (current.name !== m[1]) fail(`closing </${m[1]}> does not match open <${current.name}>`);
      current = current.parent as MNode;
      pos += m[0].length;
      continue;
    }
    const open = /^<([a-zA-Z][\w:-]*)/.exec(src.slice(pos, pos + 100));
    if (!open) return fail('stray <');
    const name = open[1];
    pos += open[0].length;
    const attrs: Record<string, string> = {};
    for (;;) {
      ATTR.lastIndex = pos;
      const a = ATTR.exec(src);
      if (!a) break;
      const [whole, rawKey, dq, sq] = a;
      // HTML attribute names are case-insensitive (React prints charSet, fetchPriority, srcSet).
      const key = mode === 'html' ? rawKey.toLowerCase() : rawKey;
      if (key in attrs) fail(`duplicate attribute ${key}`);
      const raw = dq ?? sq ?? '';
      if (/[<>]/.test(raw)) fail(`unescaped < or > in attribute ${key}`);
      attrs[key] = decodeEntities(raw);
      pos += whole.length;
    }
    while (/\s/.test(src[pos] ?? '')) pos++;
    let selfClosing = false;
    if (src[pos] === '/') {
      selfClosing = true;
      pos++;
    }
    if (src[pos] !== '>') fail('malformed tag');
    pos++;
    const node: MNode = { name, attrs, children: [], parent: current };
    current.children.push(node);
    const isVoid = mode === 'html' && VOID.has(name);
    if (isVoid || selfClosing) continue;
    current = node;
    if (mode === 'html' && RAW_TEXT.has(name)) {
      const end = src.indexOf(`</${name}>`, pos);
      if (end === -1) fail(`unterminated <${name}>`);
      node.children.push(src.slice(pos, end));
      pos = end + name.length + 3;
      current = node.parent as MNode;
    }
  }
  if (current !== root) fail(`unclosed <${current.name}>`);
  if (mode === 'xml') {
    const elements = root.children.filter((c): c is MNode => typeof c !== 'string');
    const stray = root.children.filter((c) => typeof c === 'string' && c.trim() !== '');
    if (elements.length !== 1 || stray.length > 0) fail('an XML document needs exactly one root element and no other text');
  }
  return { root, prolog };
}
const isNode = (c: MNode | string): c is MNode => typeof c !== 'string';
export const childElements = (n: MNode): MNode[] => n.children.filter(isNode);
/** All descendant elements (document order) matching `pred`. */
export function findAll(n: MNode, pred: (e: MNode) => boolean): MNode[] {
  const out: MNode[] = [];
  const walk = (x: MNode) => {
    for (const c of x.children) {
      if (!isNode(c)) continue;
      if (pred(c)) out.push(c);
      walk(c);
    }
  };
  walk(n);
  return out;
}
export const byTag = (n: MNode, tag: string): MNode[] => findAll(n, (e) => e.name === tag);
/** Concatenated text of a node, whitespace collapsed. */
export function textOf(n: MNode): string {
  const parts: string[] = [];
  const walk = (x: MNode) => {
    for (const c of x.children) {
      if (isNode(c)) walk(c);
      else parts.push(c);
    }
  };
  walk(n);
  return parts.join('').replace(/\s+/g, ' ').trim();
}
/** Visible text: like textOf but skips script and style. */
export function visibleText(n: MNode): string {
  const parts: string[] = [];
  const walk = (x: MNode) => {
    for (const c of x.children) {
      if (!isNode(c)) parts.push(c);
      else if (!RAW_TEXT.has(c.name)) walk(c);
    }
  };
  walk(n);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
