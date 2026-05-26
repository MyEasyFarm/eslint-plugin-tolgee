# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.3] — 2026-05-26

### Fixed

- **types**: `plugin.configs` was emitted as `Record<string, unknown>` in `dist/index.d.mts`, so TypeScript consumers could not spread the preset (`{ ...tolgee.configs.recommended, name, files }` failed with TS2698). The widening came from the source declaring `configs: {} as Record<string, unknown>`. Annotated as `Record<string, Linter.Config>` and applied `satisfies ESLint.Plugin` to the plugin object so the documented spread pattern type-checks without `@ts-expect-error` or `as Linter.Config` casts.
- **`plugin.meta.version`** — was hard-coded to `0.1.0` since the initial release, so introspection (`plugin.meta.version`) and any ESLint diagnostic that surfaces the plugin version reported a stale value. Now bumped in lockstep with `package.json`.

### Changed

- **`recommended` preset**: now ships a default `name: 'tolgee/recommended'` so ESLint can identify the config block in messages without consumers having to set it. Consumers that override `name` are unaffected (their value wins on spread).

## [0.2.2] — 2026-05-25

### Fixed

- **`tolgee/no-unused-placeholder-params`** / **`tolgee/enforce-placeholders`** — `extractIcuPlaceholders` only collected argument names at ICU depth 0 and never scanned for Tolgee's JSX-style tag interpolation, producing false positives on two real-world patterns: (1) `<T defaultValue="Draw <br></br> on map" params={{ br: <br /> }} />` (the JSX-tag interpolation pattern documented in the README and reinforced by `no-self-closing-tags`), and (2) ICU placeholders nested inside `select` / `plural` bodies, e.g. `{allCount, select, 0 {0 items} other {{currentCount} of {allCount}}}`. Rewrote the extractor as a recursive-descent ICU MessageFormat parser that walks into `plural` / `select` / `selectordinal` selector bodies (and treats simple typed arguments — `number`, `date`, … — as opaque) plus a separate JSX-tag pass that collects `<tag>`, `</tag>`, and `<tag/>` names (allowing hyphenated custom-element names like `<my-tag>`). Both rules now report correctly for tag-name and nested-ICU params. Reported by a downstream consumer.

## [0.2.1] — 2026-05-25

### Fixed

- **package.json entrypoints** — `main`, `types`, and `exports` were pointing at `./dist/index.js` / `./dist/index.d.ts`, but the tarball ships `./dist/index.mjs` / `./dist/index.d.mts` (tsdown's default ESM output). Consumers could not resolve the package on import. Aligned the manifest with the actual build artifacts.

### Changed

- **build**: removed dead `build:done` rename hook from `tsdown.config.ts` (targeted a hashed `index-*.d.ts` pattern tsdown no longer emits).
- **build**: migrated tsdown `external: ['eslint']` to `deps: { neverBundle: ['eslint'] }`; the previous form is deprecated. Output byte-identical.

## [0.2.0] — 2026-05-23

### Added

- **`tolgee/no-self-closing-tags`** — new rule that flags self-closing tag syntax (`<name/>`) inside Tolgee translation default values. Per the [Tolgee tags-interpolation docs](https://docs.tolgee.io/js-sdk/integrations/react/tags-interpolation), "non-closing tags and self-closing tags are not supported (issue [#3101](https://github.com/tolgee/tolgee-js/issues/3101))" — `<br/>` is not parsed and must be written as `<br></br>`. Covers `t()`, `tolgee.t()`, and `<T defaultValue=…>` (string literal or template literal without expressions). **Autofixable**: rewrites each `<name/>` to `<name></name>` in place. Conservative under non-literal defaults (identifiers, template literals with `${…}` expressions) and never touches a `<T>` element's own JSX self-closing form. Non-closing tags (`<br>` without `</br>`) are out of scope for v1 and tracked as a follow-up. Enabled in `recommended` at `error`.
- **`tolgee/no-tag-interpolation-in-t-call`** — new rule that flags JSX/React-element values in the `params` object of `t()` / `tolgee.t()` calls. Per the [Tolgee v5 React migration guide](https://docs.tolgee.io/js-sdk/5.x.x/migration_to_v5/react), tag interpolation is supported only by the `<T>` component; passing `params={{ br: <br /> }}` to `t()` silently renders the raw `<br/>` string. Covers both call-form (`t(key, defaultValue, { ... })`) and object-form (`t({ key, defaultValue, params: { ... } })`); `tolgee.t()` is treated the same. JSX fragments are also reported. Non-fixable (`t()` is commonly used in non-JSX contexts where a `<T>` rewrite would not type-check). Conservative under spreads, non-literal params, and functional tag-interpolation forms (`{ b: (chunks) => <b>{chunks}</b> }`). Enabled in `recommended` at `error`.
- **`tolgee/no-unused-placeholder-params`** — new rule that flags keys in the params object that are not referenced as ICU placeholders in `defaultValue`. Inverse of `enforce-placeholders`; the two rules together keep the placeholder set and the params object in lockstep. Covers `t()`, `tolgee.t()`, and `<T>`. Recognises `comment` as a reserved Tolgee meta key; user can extend via the `ignoreList` option. Non-fixable (a property value may carry side effects). Conservative under spreads, non-literal params, and dynamic `defaultValue`. Enabled in `recommended` at `error`.
- **`tolgee/enforce-placeholders`** — new rule that flags missing params keys for ICU placeholders referenced in `defaultValue`. Mirrors `formatjs/enforce-placeholders`. Covers `t()`, `tolgee.t()`, and `<T>`. Recognises `comment` as a reserved Tolgee meta key; user can extend via the `ignoreList` option. Non-fixable (runtime values can't be invented). Conservative under spreads, non-literal params, and `TemplateLiteral`s with expressions. Enabled in `recommended` at `error`.
- **`tolgee/no-dynamic-key`** — new rule that requires the translation key to be a string literal at the call site. Identifiers, member expressions (`KEYS.greeting`), function calls, concatenations, conditionals, and template literals with interpolations are reported. Covers `t()`, `tolgee.t()`, and `<T keyName=…>`. Non-fixable. Enabled in `recommended` at `error`.

### Changed

- **BREAKING (config key):** rule `tolgee/require-tolgee-key` renamed to `tolgee/require-key`. Behaviour unchanged. Update consumer flat configs from `'tolgee/require-tolgee-key': 'error'` to `'tolgee/require-key': 'error'`. The `recommended` preset has been updated accordingly.

### Refactored

- Extracted shared callee/component predicates to `src/utils/isTranslationCall.ts` (`isTranslationCall`, `isTComponent`). `require-key.ts`, `prefer-string-arguments.ts`, and `no-dynamic-key.ts` now share the same matcher. Semantics preserved bug-for-bug.

### Known issues (carry-overs from the internal codebase, scheduled for 0.2.1)

- **`require-key`** — `createShortHash` uses the regex `/[^a-zA-Z0-9/W+]/g` which is almost certainly a typo for `\W`. The current implementation preserves the typo for byte-equivalent behaviour with the internal version. Fix planned: replace with `/[^a-zA-Z0-9]/g`. Behaviour change: a small set of base64-encoded hashes will differ.
- **`require-key`** — the rule looks for `comment` inside `params` (`t('k', 'msg', { params: { comment } })` and `<T params={{ comment }} />`), while `prefer-string-arguments` autofixes `comment` as a sibling of `key`/`defaultValue`. The two locations are inconsistent; a single canonical location should be decided.
- **`require-key`** — `arg.properties.map((p) => p.key.name)` is unguarded and will throw on `SpreadElement` (`t({ ...spread, key: '...' })`). Needs a type guard.
- **`isTranslationCall` util** — accesses `callee.object.name` without verifying `callee.object.type === 'Identifier'`. Chained calls like `a.b.t()` resolve to `undefined === 'tolgee'` (harmless), but the access pattern is unsafe and should be guarded in a follow-up PR.

## [0.1.0] — Initial release

### Added

- `tolgee/require-tolgee-key` rule with autofix.
- `tolgee/prefer-string-arguments` rule with autofix.
- `recommended` config.
- ESM build via `tsdown`.
- ESLint v9 flat-config support.
- Vitest test suite (24 invalid + 14 valid cases — both rules combined).
