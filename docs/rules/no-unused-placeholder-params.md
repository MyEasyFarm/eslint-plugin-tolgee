# `tolgee/no-unused-placeholder-params`

Reports keys in the `params` object of a translation call when those keys are not referenced as ICU placeholders in `defaultValue`. Covers `t()`, `tolgee.t()`, and the `<T>` component. Inverse of [`tolgee/enforce-placeholders`](./enforce-placeholders.md); together they keep the placeholder set and the params object in lockstep.

A "placeholder" is the identifier appearing immediately after a `{` at the outermost level of the message. Branch labels inside `plural`/`select`/`selectordinal` bodies (`one`, `other`, `=0`, …) are not treated as placeholders.

## Rule details

### Failing examples

```js
// Extra key not used by the message
t('k', 'Hello', { name: 'X' })
tolgee.t('k', 'Hello', { name: 'X' })

// One of multiple keys unused
t('k', 'Hi {a}', { a: 1, b: 2 })

// Every key unused (multiple reports)
t('k', 'Hi', { a: 1, b: 2 })

// Object form, extra key
t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1, x: 2 } })

// JSX, extra key
;<T keyName="k" defaultValue="Hi {a}" params={{ a: 1, x: 2 }} />
```

### Passing examples

```js
t('k', 'Hi {name}', { name: 'John' })
t('k', 'Hi {a} {b}', { a: 1, b: 2 })
t('k', 'Hi', { comment: 'ctx' })
t('k', 'Hi {a}', { a: 1, comment: 'ctx' })
t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1 } })
;<T keyName="k" defaultValue="Hi {a}" params={{ a: 1 }} />
t('k', '{count, plural, one {one} other {#}}', { count: 1 })
```

## Reserved meta keys

`comment` is recognised as a Tolgee translator-context meta key — it is never reported as unused, even if absent from `defaultValue`. Extend the ignore set via the `ignoreList` option.

## Options

| Option       | Type       | Default | Description                                                                                                       |
| ------------ | ---------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `ignoreList` | `string[]` | `[]`    | Param key names that should never be reported as unused (union with the reserved `comment`).                      |

> **Note on `ignoreList` direction.** In `enforce-placeholders`, `ignoreList` says "this placeholder is not *required* in params". In `no-unused-placeholder-params`, `ignoreList` says "this param key is not *reported as unused*". Both rules accept the same option shape but apply it to opposite sides of the placeholder/params relationship.

Example:

```js
{
  rules: {
    'tolgee/no-unused-placeholder-params': [
      'error',
      { ignoreList: ['brand', 'env'] },
    ],
  },
}
```

## Known limitations

- **Dynamic `defaultValue`** (variables, `TemplateLiteral` with `${…}` expressions): skipped — placeholders are not statically knowable.
- **Spread in params** (`{ ...rest }`): the whole object is skipped — spread may carry keys that match real placeholders.
- **Non-literal params** (variable references, function calls passed as the params arg/prop): skipped.
- **Computed or non-string-literal property keys** (`[expr]: …`): the individual property is skipped.

## Message IDs

| ID            | When it fires                                                                              |
| ------------- | ------------------------------------------------------------------------------------------ |
| `unusedParam` | A param key is neither an ICU placeholder in `defaultValue` nor in the ignored/meta set    |
