# `tolgee/no-dynamic-key`

Requires the translation key to be a string literal at the call site. Variables, member expressions, function calls, and interpolated template literals are rejected. Covers `t()`, `tolgee.t()`, and the `<T>` component. **Not autofixable** — a dynamic expression cannot be safely replaced with an invented literal.

A "literal" is one of:

- A string `Literal` node (`'abc'`, `"abc"`)
- A `TemplateLiteral` with zero expressions (`` `abc` ``)

## Rule details

### Failing examples

```js
// Identifier
t(KEY, 'Hello')

// Member expression (including key-registry patterns)
t(KEYS.greeting, 'Hello')

// Template literal with interpolation
t(`pre-${id}`, 'Hello')

// Function call
t(getKey(), 'Hello')

// Concatenation
t('a' + b, 'Hello')

// Conditional
t(cond ? 'a' : 'b', 'Hello')

// TypeScript `as const` cast (still a reference at the call site)
t(KEY as const, 'Hello')

// Object form, dynamic key
t({ key: KEY, defaultValue: 'Hello' })

// JSX <T>, dynamic keyName
;<T keyName={KEY} defaultValue="Hello" />
;<T keyName={KEYS.greeting} defaultValue="Hello" />
```

### Passing examples

```js
t('abc', 'Hello')
tolgee.t('abc', 'Hello')
t(`abc`, 'Hello')
t({ key: 'abc', defaultValue: 'Hello' })
;<T keyName="abc" defaultValue="Hello" />
;<T keyName={'abc'} defaultValue="Hello" />
;<T keyName={`abc`} defaultValue="Hello" />
```

## Known restriction

Member-access patterns like `t(KEYS.greeting, …)` are reported. Tolgee's CLI extractor requires literal strings at the call site to discover keys — allowing member access would defeat the rule's purpose. If you maintain a key registry, inline the literal at the call site or accept that the registry value won't be extracted.

## Interaction with `tolgee/require-key`

This rule reports the _shape_ of the key argument. `tolgee/require-key` reports _presence_ and _hash correctness_. A call like `t(KEY)` (dynamic key, no default value) is reported only by this rule — `require-key`'s presence check assumes a literal first argument.

## Options

This rule has no options.

## Message IDs

| ID                      | When it fires                                             |
| ----------------------- | --------------------------------------------------------- |
| `dynamicKeyInCall`      | Positional form: first arg is not a string literal        |
| `dynamicKeyInObject`    | Object form: `key` property value is not a string literal |
| `dynamicKeyInComponent` | `<T>` `keyName` prop value is not a string literal        |
