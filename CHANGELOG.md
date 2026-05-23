# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`tolgee/enforce-placeholders`** — new rule that flags missing params keys for ICU placeholders referenced in `defaultValue`. Mirrors `formatjs/enforce-placeholders`. Covers `t()`, `tolgee.t()`, and `<T>`. Recognises `comment` as a reserved Tolgee meta key; user can extend via the `ignoreList` option. Non-fixable (runtime values can't be invented). Conservative under spreads, non-literal params, and `TemplateLiteral`s with expressions. Enabled in `recommended` at `error`.
- **`tolgee/no-dynamic-key`** — new rule that requires the translation key to be a string literal at the call site. Identifiers, member expressions (`KEYS.greeting`), function calls, concatenations, conditionals, and template literals with interpolations are reported. Covers `t()`, `tolgee.t()`, and `<T keyName=…>`. Non-fixable. Enabled in `recommended` at `error`.

### Changed

- **BREAKING (config key):** rule `tolgee/require-tolgee-key` renamed to `tolgee/require-key`. Behaviour unchanged. Update consumer flat configs from `'tolgee/require-tolgee-key': 'error'` to `'tolgee/require-key': 'error'`. The `recommended` preset has been updated accordingly.

### Refactored

- Extracted shared callee/component predicates to `src/utils/isTranslationCall.ts` (`isTranslationCall`, `isTComponent`). `require-key.ts`, `prefer-string-arguments.ts`, and `no-dynamic-key.ts` now share the same matcher. Semantics preserved bug-for-bug.

### Known issues (carry-overs from the internal codebase, scheduled for 0.1.1)

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
