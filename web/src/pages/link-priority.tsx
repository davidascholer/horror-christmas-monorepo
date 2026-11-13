/**
 * Internal-link priority (Task 6.5; Requirement 9.8).
 *
 * Req 9.8: internal links favor related collections, collection items,
 * character links, movie links, then product links, in that priority order.
 *
 * `LINK_GROUP_ORDER` is the single definition. Every page template puts its
 * internal-link sections through `PrioritizedLinkSections`, which renders the
 * sections in this order whatever order the template lists them in, so the
 * order cannot drift between page types. Only the order of sections is
 * decided here; the items inside a section keep the order the API gave
 * (editorial order, Req 1.4).
 *
 * The homepage (Task 7.1) has its own definition, `HOME_LINK_GROUP_ORDER`, over
 * the same mechanism: collections first (featured, seasonal, gift), then
 * characters, then movies (Req 9.8 puts character links before movie links).
 * The homepage has no product links.
 *
 * Each rendered section carries `data-link-group="..."` so tests (and later
 * tooling) can read the group sequence from the HTML.
 */
import { Fragment, type ReactNode } from 'react';
import { Section } from './shared';

export const LINK_GROUP_ORDER = [
  'related-collections',
  'collection-items',
  'characters',
  'movies',
  'products',
] as const;

export type LinkGroup = (typeof LINK_GROUP_ORDER)[number];

/** Homepage link groups in priority order (see the file header). */
export const HOME_LINK_GROUP_ORDER = [
  'featured-collections',
  'seasonal-collections',
  'gift-collection',
  'characters',
  'movies',
] as const;

export type HomeLinkGroup = (typeof HOME_LINK_GROUP_ORDER)[number];

/** Any link group name a section can carry in `data-link-group`. */
export type AnyLinkGroup = LinkGroup | HomeLinkGroup;

/** Sorts groups into priority order (stable for repeated groups). Pure. */
export function sortLinkGroups<T extends LinkGroup>(groups: readonly T[]): T[] {
  return [...groups].sort((a, b) => LINK_GROUP_ORDER.indexOf(a) - LINK_GROUP_ORDER.indexOf(b));
}

export interface LinkSectionSpec {
  id: string;
  heading: string;
  show?: boolean;
  children: ReactNode;
}

/** A group maps to one section or to several, which keep the given order among themselves. */
export type LinkSections = Partial<Record<LinkGroup, LinkSectionSpec | readonly LinkSectionSpec[]>>;

export function PrioritizedLinkSections({ sections }: { sections: LinkSections }) {
  return <OrderedLinkSections order={LINK_GROUP_ORDER} sections={sections} />;
}

/** The mechanism behind PrioritizedLinkSections, for any page-type definition (order + sections keyed by group). */
export function OrderedLinkSections<G extends AnyLinkGroup>({
  order,
  sections,
  renderSection,
}: {
  order: readonly G[];
  sections: Partial<Record<G, LinkSectionSpec | readonly LinkSectionSpec[]>>;
  /**
   * Custom markup for one section (the homepage styles its own). It must put
   * `data-link-group={group}` on its element; the default is the plain `Section`.
   */
  renderSection?: (group: G, spec: LinkSectionSpec) => ReactNode;
}) {
  return (
    <>
      {order.flatMap((group) => {
        const entry = sections[group];
        if (!entry) return [];
        const specs: readonly LinkSectionSpec[] = 'id' in entry ? [entry as LinkSectionSpec] : (entry as readonly LinkSectionSpec[]);
        return specs.map((s) => {
          const key = `${group}:${s.id}`;
          if (!renderSection) {
            return (
              <Section key={key} id={s.id} heading={s.heading} show={s.show} linkGroup={group}>
                {s.children}
              </Section>
            );
          }
          return s.show === false ? null : <Fragment key={key}>{renderSection(group, s)}</Fragment>;
        });
      })}
    </>
  );
}
