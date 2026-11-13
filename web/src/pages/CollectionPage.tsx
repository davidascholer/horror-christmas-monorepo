/**
 * Collection page (Requirements 3.1 to 3.4). Items render in the order the API supplied.
 * Internal-link sections are ordered by PrioritizedLinkSections (Req 9.8): related
 * collections, then the collection items (movies, characters, products).
 */
import type { CollectionDetail } from '../types/api-contracts';
import { characterPath, moviePath, productPath } from '../routes';
import { PrioritizedLinkSections } from './link-priority';
import { COLLECTION_TYPE_LABEL, CollectionLinkList, PageImage, Paragraphs, Section, TagList } from './shared';

function Note({ text }: { text: string | null }) {
  return text && text.trim() ? <p>{text}</p> : null;
}

export function CollectionPage({ collection }: { collection: CollectionDetail }) {
  const c = collection;
  return (
    <article>
      <header>
        <h1>{c.title}</h1>
        <p>{COLLECTION_TYPE_LABEL[c.type]}</p>
        <PageImage src={c.heroImageUrl} alt={c.heroImageAlt} fallbackAlt={c.title} priority />
        {c.summary ? <p>{c.summary}</p> : null}
      </header>

      <Section id="introduction" heading="Introduction" show={!!c.introduction.trim()}>
        <Paragraphs text={c.introduction} />
      </Section>

      <Section id="curator-notes" heading="Curator notes" show={!!c.curatorNotes.trim()}>
        <Paragraphs text={c.curatorNotes} />
      </Section>

      <PrioritizedLinkSections
        sections={{
          'related-collections': {
            id: 'related-collections',
            heading: 'Related collections',
            show: c.relatedCollections.length > 0,
            children: <CollectionLinkList collections={c.relatedCollections.map((r) => r.collection)} />,
          },
          'collection-items': [
            {
              id: 'movies',
              heading: 'Movies',
              show: c.movies.length > 0,
              children: (
                <ol>
                  {c.movies.map(({ movie, curatorNote }) => (
                    <li key={movie.id}>
                      <a href={moviePath(movie.slug)}>{movie.title}</a>
                      {movie.releaseYear !== null ? <> ({movie.releaseYear})</> : null}
                      <Note text={curatorNote} />
                    </li>
                  ))}
                </ol>
              ),
            },
            {
              id: 'characters',
              heading: 'Characters',
              show: c.characters.length > 0,
              children: (
                <ol>
                  {c.characters.map(({ character, curatorNote }) => (
                    <li key={character.id}>
                      <a href={characterPath(character.slug)}>{character.name}</a>
                      <Note text={curatorNote} />
                    </li>
                  ))}
                </ol>
              ),
            },
            {
              id: 'products',
              heading: 'Products',
              show: c.products.length > 0,
              children: (
                <ol>
                  {c.products.map(({ product, curatorNote }) => (
                    <li key={product.id}>
                      <a href={productPath(product.slug)}>{product.name}</a>
                      <Note text={curatorNote} />
                    </li>
                  ))}
                </ol>
              ),
            },
          ],
        }}
      />

      {/* Franchises have no pages, so they are listed as text. */}
      <Section id="franchises" heading="Franchises" show={c.franchises.length > 0}>
        <ol>
          {c.franchises.map(({ franchise }) => (
            <li key={franchise.id}>{franchise.name}</li>
          ))}
        </ol>
      </Section>

      <TagList tags={c.tags} />
    </article>
  );
}
