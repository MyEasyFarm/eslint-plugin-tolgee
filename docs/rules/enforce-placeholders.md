# `tolgee/enforce-placeholders`

Ensures every ICU placeholder referenced in `defaultValue` has a matching key in the params object. Covers `t()`, `tolgee.t()`, and the `<T>` component. Mirrors the contract of [`formatjs/enforce-placeholders`](https://formatjs.github.io/docs/tooling/linter/#enforce-placeholders). **Not autofixable** — runtime values can't be invented.

A "placeholder" is the identifier appearing immediately after a `{` at the outermost level of the message. Branch labels inside `plural`/`select`/`selectordinal` bodies (`one`, `other`, `=0`, …) are not treated as placeholders.

## Rule details

### Failing examples

```js
// Missing params object entirely
t('k', 'Hi {name}!')
tolgee.t('k', 'Hi {name}!')

// Only translator-comment meta provided; placeholder unmet
t('k', 'Hi {name}', { comment: 'ctx' })

// One of multiple placeholders missing
t('k', 'Hi {a} {b}', { a: 1 })

// Object form, no params
t({ key: 'k', defaultValue: 'Hi {n}' })

// Object form, params present but incomplete
t({ key: 'k', defaultValue: 'Hi {a} {b}', params: { a: 1 } })

// JSX, no params
;<T keyName="k" defaultValue="Hi {n}" />

// JSX, params incomplete
;<T keyName="k" defaultValue="Hi {a} {b}" params={{ a: 1 }} />

// Plural — outer placeholder name still required
t('k', '{count, plural, one {one} other {#}}', {})
```

### Passing examples

```js
t('k', 'Hello world')
t('k', 'Hi {name}!', { name: 'John' })
t('k', 'Hi', { comment: 'ctx' })
t('k', 'Hi {a}', { a: 1, comment: 'ctx' })
t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1 } })
;<T keyName="k" defaultValue="Hi {a}" params={{ a: 1 }} />
t('k', '{count, plural, one {one} other {#}}', { count: 1 })
t('k', '{a} {b}', { a: 1, b: 2 })
```

## Reserved meta keys

`comment` is recognised as a Tolgee translator-context meta key — it is never reported as a missing placeholder. Extend the ignore set via the `ignoreList` option.

## Options

| Option       | Type       | Default | Description                                                                 |
| ------------ | ---------- | ------- | --------------------------------------------------------------------------- |
| `ignoreList` | `string[]` | `[]`    | Additional placeholder names to ignore (union with the reserved `comment`). |

Example:

```js
{
  rules: {
    'tolgee/enforce-placeholders': [
      'error',
      { ignoreList: ['brand', 'env'] },
    ],
  },
}
```

## Known limitations

- **Dynamic `defaultValue`** (variables, `TemplateLiteral` with `${…}` expressions): skipped — the string is not statically analysable.
- **Spread in params** (`{ ...rest }`): skipped — the spread may supply missing keys at runtime.
- **Non-literal params** (variable references, function calls passed as the params arg/prop): skipped.
- **Nested ICU branch labels** (`one`, `other`, `=0`, etc.): intentionally ignored. Only the outer placeholder name (`count` in `{count, plural, …}`) is required.

## Message IDs

| ID                      | When it fires                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `missingParamsObject`   | `defaultValue` references placeholders but no params object/prop is provided                                            |
| `missingPlaceholderKey` | params is a literal object missing a placeholder name — reported once per missing name (`{{name}}` in the message data) |
