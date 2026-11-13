/**
 * Movie page (Requirements 4.1, 4.2). Unknown runtime/year/rating are omitted, never inferred (Req 10.8).
 * Internal-link sections are ordered by PrioritizedLinkSections (Req 9.8): collections, characters, products.
 */
import type { MovieDetail } from '../types/api-contracts';
import { characterPath, productPath } from '../routes';
import { firstUsableImageUrl } from './image-sources';
import { PrioritizedLinkSections } from './link-priority';
import { CollectionLinkList, LinkList, MEDIA_TYPE_LABEL, PageImage, Paragraphs, Section, TagList, safeUrl } from './shared';

export function MoviePage({ movie }: { movie: MovieDetail }) {
  const m = movie;
  const trailer = safeUrl(m.trailerUrl);
  // The date is shown exactly as the API gives it (ISO-8601); the year is the fallback.
  const release = m.releaseDate ?? (m.releaseYear !== null ? String(m.releaseYear) : null);
  const productSummary = (p: MovieDetail['relatedProducts'][number]) => p.description;

  return (
    <article>
      <header>
        <h1>{m.title}</h1>
        {m.originalTitle && m.originalTitle !== m.title ? <p>Original title: {m.originalTitle}</p> : null}
        <dl>
          <dt>Type</dt>
          <dd>{MEDIA_TYPE_LABEL[m.mediaType]}</dd>
          {release ? (
            <>
              <dt>Released</dt>
              <dd>{release}</dd>
            </>
          ) : null}
          {m.runtime !== null ? (
            <>
              <dt>Runtime</dt>
              <dd>{m.runtime} minutes</dd>
            </>
          ) : null}
          {m.franchise ? (
            <>
              <dt>Franchise</dt>
              <dd>{m.franchise.name}</dd>
            </>
          ) : null}
        </dl>
        {/* Poster, else hero image, else the fallback. The model has no alt text: the title is the alt. */}
        <PageImage src={firstUsableImageUrl([m.posterUrl, m.heroImageUrl])} fallbackAlt={m.title} priority />
        {/*
          PLACEHOLDER (Task 8.3): add-to-watchlist action (Req 4.2). Watchlists
          need JavaScript and the API, so this is an inert, hidden element
          with no behavior. Task 8.3 replaces it with the working control.
        */}
        <div hidden data-placeholder="add-to-watchlist" data-movie-slug={m.slug} />
      </header>

      <Section id="synopsis" heading="Synopsis" show={!!m.synopsis?.trim()}>
        <Paragraphs text={m.synopsis} />
      </Section>

      <Section id="trailer" heading="Trailer" show={trailer !== null}>
        <p>
          <a href={trailer ?? undefined}>Watch the trailer for {m.title}</a>
        </p>
      </Section>

      <PrioritizedLinkSections
        sections={{
          'related-collections': {
            id: 'collections',
            heading: 'Featured in collections',
            show: m.collections.length > 0,
            children: <CollectionLinkList collections={m.collections} />,
          },
          characters: {
            id: 'characters',
            heading: 'Characters',
            show: m.characters.length > 0,
            children: (
              <ul>
                {m.characters.map(({ character, role }) => (
                  <li key={character.id}>
                    <a href={characterPath(character.slug)}>{character.name}</a>
                    {role ? <> ({role})</> : null}
                  </li>
                ))}
              </ul>
            ),
          },
          products: {
            id: 'products',
            heading: 'Related products',
            show: m.relatedProducts.length > 0,
            children: (
              <LinkList
                items={m.relatedProducts}
                keyOf={(p) => p.id}
                hrefOf={(p) => productPath(p.slug)}
                labelOf={(p) => p.name}
                describe={productSummary}
              />
            ),
          },
        }}
      />

      <TagList tags={m.tags} />
    </article>
  );
}
