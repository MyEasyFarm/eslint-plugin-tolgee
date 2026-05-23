# @myeasyfarm/eslint-plugin-tolgee

ESLint rules for [Tolgee](https://tolgee.io) i18n. Catches missing translation keys and standardises `t()` call shape across a codebase.

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
      'tolgee/require-tolgee-key': 'error',
      'tolgee/prefer-string-arguments': 'error',
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

| Rule | Description | Autofix |
|---|---|:-:|
| [`tolgee/require-tolgee-key`](./docs/rules/require-tolgee-key.md) | Enforces a non-empty hash-derived key on `t()`, `tolgee.t()`, and `<T>`. | ✅ |
| [`tolgee/prefer-string-arguments`](./docs/rules/prefer-string-arguments.md) | Rewrites `t({ key, defaultValue })` to `t(key, defaultValue)`. | ✅ |

## Configs

| Config | Contents |
|---|---|
| `recommended` | Both rules at `error`. |

## Contributing

```sh
npm install
npm test
npm run build
```

## License

MIT — see [LICENSE](./LICENSE).
