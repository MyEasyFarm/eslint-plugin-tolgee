# @myeasyfarm/eslint-plugin-tolgee

ESLint rules for [Tolgee](https://tolgee.io) i18n. Catches missing or dynamic translation keys and standardises `t()` call shape across a codebase.

## Install

```sh
npm install --save-dev @myeasyfarm/eslint-plugin-tolgee eslint
```

Requires:

- Node `>=20`
- ESLint `>=9` (flat config)
- For TypeScript / JSX sources: `@typescript-eslint/parser` (consumer-provided)

## Usage (flat config)

```js
// eslint.config.mjs
import tolgee from '@myeasyfarm/eslint-plugin-tolgee'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      tolgee,
    },
    rules: {
      'tolgee/require-key': 'error',
      'tolgee/prefer-string-arguments': 'error',
      'tolgee/no-dynamic-key': 'error',
      'tolgee/enforce-placeholders': 'error',
      'tolgee/no-unused-placeholder-params': 'error',
      'tolgee/no-tag-interpolation-in-t-call': 'error',
      'tolgee/no-self-closing-tags': 'error',
    },
  },
]
```

Or use the bundled preset:

```js
import tolgee from '@myeasyfarm/eslint-plugin-tolgee'

export default [tolgee.configs.recommended]
```

## Rules

| Rule                                                                                    | Description                                                                                   | Autofix |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | :-----: |
| [`tolgee/require-key`](./docs/rules/require-key.md)                                     | Enforces a non-empty hash-derived key on `t()`, `tolgee.t()`, and `<T>`.                      |   ✅    |
| [`tolgee/prefer-string-arguments`](./docs/rules/prefer-string-arguments.md)             | Rewrites `t({ key, defaultValue })` to `t(key, defaultValue)`.                                |   ✅    |
| [`tolgee/no-dynamic-key`](./docs/rules/no-dynamic-key.md)                               | Requires the translation key to be a string literal at the call site.                         |   ❌    |
| [`tolgee/enforce-placeholders`](./docs/rules/enforce-placeholders.md)                   | Requires every ICU placeholder in `defaultValue` to have a matching key in the params object. |   ❌    |
| [`tolgee/no-unused-placeholder-params`](./docs/rules/no-unused-placeholder-params.md)   | Reports params keys that are not referenced as ICU placeholders in `defaultValue`.            |   ❌    |
| [`tolgee/no-tag-interpolation-in-t-call`](./docs/rules/no-tag-interpolation-in-t-call.md) | Disallows JSX values in the `params` of `t()` / `tolgee.t()`; tag interpolation works only on `<T>`. |   ❌    |
| [`tolgee/no-self-closing-tags`](./docs/rules/no-self-closing-tags.md)                   | Disallows `<name/>` inside translation defaults — Tolgee does not parse self-closing tags. Autofixes to `<name></name>`. |   ✅    |

## Configs

| Config        | Contents                    |
| ------------- | --------------------------- |
| `recommended` | All seven rules at `error`. |

## Contributing

```sh
npm install
npm test
npm run build
```

## License

MIT — see [LICENSE](./LICENSE).
