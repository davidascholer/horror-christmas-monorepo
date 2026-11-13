/**
 * Product page (Requirement 4.4).
 *
 * Price is rendered as the decimal string the API supplied; it is never parsed
 * to a number, so "24.90" stays "24.90".
 *
 * Affiliate links are outbound: rel="sponsored noopener" marks them as paid
 * placements for search engines and cuts the opener reference, and
 * target="_blank" opens the retailer in a new tab so the visitor keeps their
 * place in the collection. Links with an unsafe URL scheme are dropped.
 *
 * Internal-link sections are ordered by PrioritizedLinkSections (Req 9.8):
 * collections, then characters. Affiliate links are outbound, not internal.
 */
import type { ProductDetail } from '../types/api-contracts';
import { characterPath } from '../routes';
import { PrioritizedLinkSections } from './link-priority';
import { CollectionLinkList, LinkList, PageImage, Paragraphs, Section, TagList, safeUrl } from './shared';

export function ProductPage({ product }: { product: ProductDetail }) {
  const p = product;
  const links = p.affiliateLinks.flatMap((link) => {
    const href = safeUrl(link.url);
    return href && /^https?:/i.test(href) ? [{ id: link.id, provider: link.provider, href }] : [];
  });

  return (
    <article>
      <header>
        <h1>{p.name}</h1>
        <dl>
          {p.category ? (
            <>
              <dt>Category</dt>
              <dd>{p.category}</dd>
            </>
          ) : null}
          {p.price !== null ? (
            <>
              <dt>Price</dt>
              <dd>
                {p.price}
                {p.currency ? <> {p.currency}</> : null}
              </dd>
            </>
          ) : null}
          {p.franchise ? (
            <>
              <dt>Franchise</dt>
              <dd>{p.franchise.name}</dd>
            </>
          ) : null}
        </dl>
        <PageImage src={p.imageUrl} alt={p.imageAlt} fallbackAlt={p.name} priority />
      </header>

      <Section id="description" heading="Description" show={!!p.description?.trim()}>
        <Paragraphs text={p.description} />
      </Section>

      <Section id="where-to-buy" heading="Where to buy" show={links.length > 0}>
        <ul>
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.href} rel="sponsored noopener" target="_blank">
                View {p.name} at {l.provider}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <PrioritizedLinkSections
        sections={{
          'related-collections': {
            id: 'collections',
            heading: 'Featured in collections',
            show: p.collections.length > 0,
            children: <CollectionLinkList collections={p.collections} />,
          },
          characters: {
            id: 'characters',
            heading: 'Related characters',
            show: p.characters.length > 0,
            children: (
              <LinkList
                items={p.characters}
                keyOf={(c) => c.character.id}
                hrefOf={(c) => characterPath(c.character.slug)}
                labelOf={(c) => c.character.name}
              />
            ),
          },
        }}
      />

      <TagList tags={p.tags} />
    </article>
  );
}
