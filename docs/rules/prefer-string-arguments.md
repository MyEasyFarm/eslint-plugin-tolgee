# `tolgee/prefer-string-arguments`

Prefers the positional string form of `t()` over the object form. Autofixable.

`t({ key, defaultValue, params })` becomes `t(key, defaultValue, params)`. Improves readability and matches the canonical Tolgee call signature.

## Rule details

### Failing examples

```js
t({ key: 'abc123', defaultValue: 'Hello world' })
tolgee.t({ key: 'abc123', defaultValue: 'Hello world' })
t({ key: 'abc123', defaultValue: 'Hello, {name}!', params: { name: 'John' } })
t({ key: 'abc123', defaultValue: 'This is a test', params: { comment: 'Context for translators' } })
```

### Passing examples

```js
t('abc123', 'Hello world')
tolgee.t('abc123', 'Hello world')
t('abc123', 'Hello, {name}!', { name: 'John' })
t('abc123', 'This is a test', { comment: 'Context for translators' })
```

## Options

This rule has no options.

## Message IDs

| ID | When it fires |
|---|---|
| `preferStringArguments` | A `t()` or `tolgee.t()` call uses the object form with both `key` and `defaultValue` |
