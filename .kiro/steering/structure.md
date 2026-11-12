---
inclusion: always
---

# Repository and documentation structure

## Current repository state

This repository currently contains product and architecture documentation; it
does not contain an application `src/`, Prisma schema, package manifests, or
an implemented backend. Do not describe planned code as already implemented,
and do not add speculative runtime configuration during documentation work.

## Kiro execution documents

- `.kiro/specs/collection-first-mvp/requirements.md` — canonical user stories
  and acceptance criteria.
- `.kiro/specs/collection-first-mvp/design.md` — canonical technical design,
  contracts, architecture, and correctness properties.
- `.kiro/specs/collection-first-mvp/tasks.md` — single phased execution list;
  tasks remain unchecked until implementation is performed and verified.
- `.kiro/steering/product.md`, `tech.md`, and `structure.md` — always-included
  project guidance.

## Supporting source material

Keep detailed product, editorial, architecture, API, data-model, and launch
references in `docs/`, including accepted decisions in `docs/adr/`. Do not
create a second canonical implementation checklist in the reference docs.
Update references when an approved native-spec/ADR decision makes them
conflicting.

The future application is expected to preserve separate frontend and backend
boundaries, shared contracts where needed, and PostgreSQL/Prisma data
ownership. Exact source folders and runtime files are implementation
deliverables, not present-day facts or requirements to create during this
documentation conversion.

## Conflict and change handling

Accepted ADRs control their explicitly decided architectural choices. The
reviewed native Kiro requirements/design/tasks are the execution source of
truth. Other original documentation is supporting reference material. If the
two disagree, pause the affected work, state the conflicting passages, and ask
the owner to approve a decision; do not silently resolve or mask the conflict.
After approval, update the native specification and affected references
together.
