# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Known issues (carry-overs from the internal codebase, scheduled for 0.1.1)

- **`require-tolgee-key`** — `createShortHash` uses the regex `/[^a-zA-Z0-9/W+]/g` which is almost certainly a typo for `\W`. The current implementation preserves the typo for byte-equivalent behaviour with the internal version. Fix planned: replace with `/[^a-zA-Z0-9]/g`. Behaviour change: a small set of base64-encoded hashes will differ.
- **`require-tolgee-key`** — the rule looks for `comment` inside `params` (`t('k', 'msg', { params: { comment } })` and `<T params={{ comment }} />`), while `prefer-string-arguments` autofixes `comment` as a sibling of `key`/`defaultValue`. The two locations are inconsistent; a single canonical location should be decided.
- **`require-tolgee-key`** — `arg.properties.map((p) => p.key.name)` is unguarded and will throw on `SpreadElement` (`t({ ...spread, key: '...' })`). Needs a type guard.

## [0.1.0] — Initial release

### Added

- `tolgee/require-tolgee-key` rule with autofix.
- `tolgee/prefer-string-arguments` rule with autofix.
- `recommended` config.
- ESM build via `tsdown`.
- ESLint v9 flat-config support.
- Vitest test suite (24 invalid + 14 valid cases — both rules combined).
