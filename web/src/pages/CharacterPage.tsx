/**
 * Character page (Requirement 4.3). Internal-link sections are ordered by
 * PrioritizedLinkSections (Req 9.8): collections, movies, products.
 */
import type { CharacterDetail } from '../types/api-contracts';
import { moviePath, productPath } from '../routes';
import { PrioritizedLinkSections } from './link-priority';
import { CollectionLinkList, LinkList, PageImage, Paragraphs, Section, TagList } from './shared';

export function CharacterPage({ character }: { character: CharacterDetail }) {
  const c = character;
  return (
    <article>
      <header>
        <h1>{c.name}</h1>
        {c.franchise ? <p>Franchise: {c.franchise.name}</p> : null}
        {c.summary ? <p>{c.summary}</p> : null}
        {/* The model has no alt text: the character name is the alt. */}
        <PageImage src={c.imageUrl} fallbackAlt={c.name} priority />
      </header>

      <Section id="biography" heading="Biography" show={!!c.biography?.trim()}>
        <Paragraphs text={c.biography} />
      </Section>

      <PrioritizedLinkSections
        sections={{
          'related-collections': {
            id: 'collections',
            heading: 'Featured in collections',
            show: c.collections.length > 0,
            children: <CollectionLinkList collections={c.collections} />,
          },
          movies: {
            id: 'movies',
            heading: 'Movies',
            show: c.movies.length > 0,
            children: (
              <LinkList
                items={c.movies}
                keyOf={(m) => m.id}
                hrefOf={(m) => moviePath(m.slug)}
                labelOf={(m) => m.title}
                describe={(m) => (m.releaseYear !== null ? `(${m.releaseYear})` : null)}
              />
            ),
          },
          products: {
            id: 'products',
            heading: 'Products',
            show: c.products.length > 0,
            children: (
              <LinkList
                items={c.products}
                keyOf={(p) => p.id}
                hrefOf={(p) => productPath(p.slug)}
                labelOf={(p) => p.name}
              />
            ),
          },
        }}
      />

      <TagList tags={c.tags} />
    </article>
  );
}
