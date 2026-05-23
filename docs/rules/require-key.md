# `tolgee/require-key`

Ensures every Tolgee translation call carries a non-empty key derived from its default value. Covers `t()`, `tolgee.t()`, and the `<T>` component. Autofixable.

The key is computed as the first 6 characters of an SHA-512 base64 hash of `${defaultValue}${comment}`.

## Rule details

### Failing examples

```js
// Missing key — autofix inserts the computed hash.
t('Hello world')

// Empty key.
t('', 'Hello world')

// Key does not match the hash of defaultValue + comment.
t('wrongkey', 'Hello world')

// Object form, missing key.
t({ defaultValue: 'Hello world' })

// Object form, key out of sync.
t({ key: 'wrongkey', defaultValue: 'Hello world' })

// JSX <T> missing keyName.
<T defaultValue="Hello world" />

// JSX <T> with invalid keyName.
<T keyName="wrongkey" defaultValue="Hello world" />
```

### Passing examples

```js
import { useTranslate, T } from '@tolgee/react'

const { t } = useTranslate()

t('S2gJZD', 'Hello world')
tolgee.t('S2gJZD', 'Hello world')
t({ key: 'S2gJZD', defaultValue: 'Hello world' })
t('S2gJZD', 'Hello world', { name: 'John' })
t('xRzKpH', 'This is a test', { comment: 'Context for translators' })
;<T keyName="S2gJZD" defaultValue="Hello world" />
;<T keyName="S2gJZD" defaultValue={'Hello world'} />
;<T keyName="S2gJZD" defaultValue="Hello world" params={{ name: 'John' }} />
```

## Options

This rule has no options.

## Message IDs

| ID                               | When it fires                                         |
| -------------------------------- | ----------------------------------------------------- |
| `missingLiteralKeyProp`          | Positional form: key argument is missing or empty     |
| `missingLiteralDefaultValueProp` | Positional form: defaultValue argument is missing     |
| `invalidLiteralKeyValueProp`     | Positional form: key does not match the expected hash |
| `missingObjectKeyProp`           | Object form: `key` property missing or empty          |
| `missingObjectDefaultValueProp`  | Object form: `defaultValue` property missing          |
| `invalidObjectKeyValueProp`      | Object form: `key` does not match the expected hash   |
| `missingKeyInComponent`          | `<T>` missing or empty `keyName`                      |
| `missingDefaultValueInComponent` | `<T>` missing `defaultValue`                          |
| `invalidKeyInComponent`          | `<T>` `keyName` does not match the expected hash      |
