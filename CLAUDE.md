# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ESLint 9 flat-config plugin (`@myeasyfarm/eslint-plugin-tolgee`) shipping three rules for Tolgee i18n: `require-key`, `prefer-string-arguments`, `no-dynamic-key`. ESM-only, Node >=20.

## Commands

- `npm run validate` — format:check + lint + typecheck + test. Always run this before committing; the individual scripts are not a substitute.
- `npm test` — vitest run (one-shot). `npm run test:watch` for watch mode.
- `npm run format` — `oxfmt` writes `src/` and `tests/` in place. `npm run format:check` verifies without writing (run by `validate`).
- `npm run build` — `tsdown` bundle into `dist/`. Has a post-build hook that renames `index-*.d.ts` to `index.d.ts`.

## Adding or changing a rule (test-first)

1. Write tests first in `tests/rules/<rule-name>.test.ts` using `eslint-vitest-rule-tester`'s `run({ valid: [...], invalid: [...] })` pattern (see existing tests for the shape).
2. Implement in `src/rules/<rule-name>.ts` as a `Rule.RuleModule` with `meta` (type, docs, fixable, schema, messages) and `create()` returning a visitor map. Reuse `src/utils/isTranslationCall.ts` for detecting `t()`, `tolgee.t()`, and `<T>` patterns.
3. Wire the rule into `src/index.ts` — rules are registered manually in both `plugin.rules` and `configs.recommended.rules`. There is no auto-discovery.
4. Run `npm run validate` and iterate until green.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Recent history mixes prefixes (`add:`, `fix:`) — going forward, prefer the conventional set.
- `eslint` and `@typescript-eslint/utils` are external/peer deps — never bundle them.
- TypeScript strict mode is on; respect it (no `any` without a comment explaining why).

## Typecheck feedback

After editing a `.ts` file under `src/` or `tests/`, call the TypeScript LSP for fast, scoped diagnostics on just that file — use `mcp__plugin_oh-my-claudecode_t__lsp_diagnostics` with the file path. Prefer this over running `npx tsc --noEmit` per edit. The full `npm run validate` (which includes `tsc --noEmit` across the project) still runs at end-of-turn via the Stop hook.
