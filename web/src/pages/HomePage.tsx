/**
 * Homepage (Task 7.1, Part B; Requirements 1.1, 1.2, 2.1 to 2.5, 15.3).
 *
 * All catalog content comes from the `GET /home` projection (HomeResponse),
 * fetched at build time; nothing about collections, movies or characters is
 * written here (Req 9.2). Fixed site text (hero, headings) is in home-content.ts.
 *
 * Order of content, which is also the DOM order (collections are the product):
 *   1. hero: the platform introduction and a call to action that jumps to the featured collections
 *   2. featured collections, in API order (editorial order, Req 2.5)
 *   3. seasonal collections (own section, only when there are some)
 *   4. gift collection (a prominent card, only when there is one)
 *   5. featured character, then featured movie (only when there are some; character first as in Req 9.8)
 * Link sections go through the shared link-priority mechanism with the
 * homepage definition HOME_LINK_GROUP_ORDER; each carries `data-link-group`.
 *
 * Semantics: one h1 (the hero), one h2 per section, one h3 per card. Cards are
 * list items. The card heading holds the one link (its text is the title); a
 * stretched pseudo-element makes the whole card clickable without nesting links.
 * A value that is absent (null / empty) renders nothing: no heading, no
 * placeholder text. A reference to something that is not built renders its
 * title as plain text, never a dead link (RenderContext, see render-context.ts).
 *
 * Images: every card image is `loading="lazy"` (see the README, "Homepage").
 * The hero has no image, and the cards sit below the fold of a full-height
 * hero, so there is no above-the-fold image to prioritize; no image is eager and
 * no image preload link is produced.
 *
 * The visual atmosphere of the hero is CSS only (styles.css, `.hero-*`); every
 * animation is behind `motion-safe:`.
 */
import { useContext, type ReactNode } from 'react';
import type { CharacterSummary, CollectionSummary, HomeResponse, MovieSummary } from '../types/api-contracts';
import { FEATURED_COLLECTIONS_ANCHOR, characterPath, collectionPath, moviePath } from '../routes';
import {
  HOME_CTA_LABEL, HOME_EYEBROW, HOME_HEADINGS, HOME_HEADLINE_LEAD, HOME_HEADLINE_TAIL, HOME_INTRO,
} from './home-content';
import { HOME_LINK_GROUP_ORDER, OrderedLinkSections, type HomeLinkGroup, type LinkSectionSpec } from './link-priority';
import { RenderContext } from './render-context';
import { COLLECTION_TYPE_LABEL, MEDIA_TYPE_LABEL, PageImage } from './shared';

const text = (value: string | null | undefined): string | null => (value && value.trim() ? value : null);

/** Joins class names, skipping the empty ones (so the markup has no stray spaces or `class=""`). */
const cx = (...names: Array<string | false | null | undefined>): string | undefined => names.filter(Boolean).join(' ') || undefined;

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
interface CardProps {
  /** Null: shown as plain text (the target is not built). */
  href: string | null;
  title: string;
  /** Small label above the title (kind of collection, media type and year). */
  label: string | null;
  summary: string | null;
  imageSrc: string | null;
  /** Required by PageImage: used as alt text (the models carry no alt text for summaries). */
  imageFallbackAlt: string;
  /** `feature` is the large horizontal card (gift, featured character and movie). */
  size?: 'default' | 'feature';
  /** Background of the card; `ink` inside the surface-colored seasonal band. */
  tone?: 'surface' | 'ink';
}

function HomeCard({ href, title, label, summary, imageSrc, imageFallbackAlt, size = 'default', tone = 'surface' }: CardProps) {
  const feature = size === 'feature';
  return (
    <li
      className={cx(
        'group relative flex h-full flex-col overflow-hidden rounded-md border border-line',
        tone === 'ink' ? 'bg-ink' : 'bg-surface',
        'motion-safe:transition motion-safe:duration-200',
        href && 'hover:border-blood-glow motion-safe:hover:-translate-y-1',
        'has-[a:focus-visible]:border-slime',
        feature && 'md:flex-row',
      )}
    >
      <div
        className={cx(
          'aspect-video shrink-0 overflow-hidden bg-raised text-sm text-bone-muted',
          '[&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_picture]:block [&_picture]:h-full',
          feature && 'md:aspect-auto md:w-2/5',
        )}
      >
        <PageImage src={imageSrc} fallbackAlt={imageFallbackAlt} />
      </div>
      <div className={cx('flex flex-1 flex-col gap-2 p-5', feature && 'justify-center md:p-8')}>
        {label ? <p className="text-xs font-semibold tracking-widest text-blood-glow uppercase">{label}</p> : null}
        <h3 className={cx('leading-snug font-bold text-bone [overflow-wrap:anywhere]', feature ? 'text-2xl sm:text-3xl' : 'text-xl')}>
          {href ? (
            <a
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:content-[''] group-hover:text-slime-soft motion-safe:transition-colors"
            >
              {title}
            </a>
          ) : (
            title
          )}
        </h3>
        {summary ? <p className={cx('text-bone-muted', feature ? 'line-clamp-5' : 'line-clamp-3 text-sm')}>{summary}</p> : null}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Cards per kind of summary (only fields that exist on the Summary types)
// ---------------------------------------------------------------------------
function useKnown() {
  return useContext(RenderContext);
}

function CollectionCard({ c, ...rest }: { c: CollectionSummary } & Pick<CardProps, 'size' | 'tone'>) {
  const { knownCollectionSlugs } = useKnown();
  const built = knownCollectionSlugs === null || knownCollectionSlugs.has(c.slug);
  return (
    <HomeCard
      href={built ? collectionPath(c.slug) : null}
      title={c.title}
      label={COLLECTION_TYPE_LABEL[c.type] ?? null}
      summary={text(c.summary)}
      imageSrc={c.heroImageUrl}
      imageFallbackAlt={c.title}
      {...rest}
    />
  );
}

function CharacterCard({ c }: { c: CharacterSummary }) {
  const { knownCharacterSlugs } = useKnown();
  const built = knownCharacterSlugs === null || knownCharacterSlugs.has(c.slug);
  return (
    <HomeCard
      href={built ? characterPath(c.slug) : null}
      title={c.name}
      label="Character"
      summary={text(c.summary)}
      imageSrc={c.imageUrl}
      imageFallbackAlt={c.name}
      size="feature"
    />
  );
}

function MovieCard({ m }: { m: MovieSummary }) {
  const { knownMovieSlugs } = useKnown();
  const built = knownMovieSlugs === null || knownMovieSlugs.has(m.slug);
  const kind = MEDIA_TYPE_LABEL[m.mediaType] ?? null;
  const label = kind && m.releaseYear !== null ? `${kind}, ${m.releaseYear}` : kind;
  return (
    <HomeCard
      href={built ? moviePath(m.slug) : null}
      title={m.title}
      label={label}
      summary={text(m.synopsis)}
      imageSrc={m.posterUrl}
      imageFallbackAlt={m.title}
      size="feature"
    />
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
const CARD_GRID = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';
const FEATURE_LIST = 'grid max-w-4xl gap-6';

/** Section frame: full-width band, centered content, h2 with an accent rule. */
function HomeSection({ group, spec }: { group: HomeLinkGroup; spec: LinkSectionSpec }) {
  const seasonal = group === 'seasonal-collections';
  return (
    <section
      id={spec.id}
      aria-labelledby={`${spec.id}-heading`}
      data-link-group={group}
      className={seasonal ? 'border-y border-blood-deep bg-surface' : undefined}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <span aria-hidden="true" className={cx('mb-4 block h-1 w-12', seasonal ? 'bg-slime' : 'bg-blood')} />
        <h2 id={`${spec.id}-heading`} className="mb-8 text-2xl font-bold tracking-tight text-bone sm:text-3xl">
          {spec.heading}
        </h2>
        {spec.children}
      </div>
    </section>
  );
}

function CardList({ className, children }: { className: string; children: ReactNode }) {
  // role="list": Tailwind's reset removes list markers, which makes some screen readers drop the list semantics.
  return (
    <ul role="list" className={className}>
      {children}
    </ul>
  );
}

function Hero({ hasFeaturedCollections }: { hasFeaturedCollections: boolean }) {
  return (
    <section aria-labelledby="home-heading" className="relative isolate overflow-hidden border-b border-line">
      {/* Decoration only: layered gradients, a glow and drifting snow, pure CSS. See styles.css (.hero-*). */}
      <div aria-hidden="true" className="hero-atmosphere">
        <div className="hero-glow motion-safe:animate-flicker" />
        <div className="hero-snow motion-safe:animate-snow-far" />
        <div className="hero-snow hero-snow-near motion-safe:animate-snow-near" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
        <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-blood-glow uppercase">{HOME_EYEBROW}</p>
        <h1
          id="home-heading"
          className="max-w-4xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-bone [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl"
        >
          {HOME_HEADLINE_LEAD} <span className="block text-slime">{HOME_HEADLINE_TAIL}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-bone sm:text-xl">{HOME_INTRO}</p>
        {hasFeaturedCollections ? (
          <a
            href={`#${FEATURED_COLLECTIONS_ANCHOR}`}
            className="mt-10 inline-flex min-h-12 items-center justify-center rounded-sm bg-blood px-8 text-base font-semibold text-bone hover:bg-blood-deep motion-safe:transition-colors"
          >
            {HOME_CTA_LABEL}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function HomePage({ home }: { home: HomeResponse }) {
  const { featuredCollections, seasonalCollections, giftCollection, featuredCharacter, featuredMovie } = home;
  return (
    <>
      <Hero hasFeaturedCollections={featuredCollections.length > 0} />
      <OrderedLinkSections
        order={HOME_LINK_GROUP_ORDER}
        renderSection={(group, spec) => <HomeSection group={group} spec={spec} />}
        sections={{
          'featured-collections': {
            id: FEATURED_COLLECTIONS_ANCHOR,
            heading: HOME_HEADINGS.featuredCollections,
            show: featuredCollections.length > 0,
            children: (
              <CardList className={CARD_GRID}>
                {featuredCollections.map((c) => (
                  <CollectionCard key={c.id} c={c} />
                ))}
              </CardList>
            ),
          },
          'seasonal-collections': {
            id: 'seasonal-collections',
            heading: HOME_HEADINGS.seasonalCollections,
            show: seasonalCollections.length > 0,
            children: (
              <CardList className={CARD_GRID}>
                {seasonalCollections.map((c) => (
                  <CollectionCard key={c.id} c={c} tone="ink" />
                ))}
              </CardList>
            ),
          },
          'gift-collection': {
            id: 'gift-ideas',
            heading: HOME_HEADINGS.gift,
            show: giftCollection !== null,
            children: giftCollection ? (
              <CardList className={FEATURE_LIST}>
                <CollectionCard c={giftCollection} size="feature" />
              </CardList>
            ) : null,
          },
          characters: {
            id: 'featured-character',
            heading: HOME_HEADINGS.character,
            show: featuredCharacter !== null,
            children: featuredCharacter ? (
              <CardList className={FEATURE_LIST}>
                <CharacterCard c={featuredCharacter} />
              </CardList>
            ) : null,
          },
          movies: {
            id: 'featured-movie',
            heading: HOME_HEADINGS.movie,
            show: featuredMovie !== null,
            children: featuredMovie ? (
              <CardList className={FEATURE_LIST}>
                <MovieCard m={featuredMovie} />
              </CardList>
            ) : null,
          },
        }}
      />
    </>
  );
}
