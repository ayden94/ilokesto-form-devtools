# @ilokesto/form-devtools

This directory contains the framework-independent developer tools package for `@ilokesto/form`.

## Rules

- Depend only on the public `@ilokesto/form` contract.
- Keep the custom element and Lit UI framework-independent.
- React-specific code belongs in `src/react.ts`.
- Keep the first release read-only: observe form state, never mutate it.
- Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before committing.
- Add a root changeset for consumer-facing changes.
