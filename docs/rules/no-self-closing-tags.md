# `tolgee/no-self-closing-tags`

Disallows self-closing tag syntax (`<name/>`) inside Tolgee translation default values. Per the [Tolgee tags-interpolation docs](https://docs.tolgee.io/js-sdk/integrations/react/tags-interpolation):

> Currently, non-closing tags and self-closing tags are not supported ([issue #3101](https://github.com/tolgee/tolgee-js/issues/3101)).

So `<br/>` and `<hr/>` in a translation string are not parsed by Tolgee — the correct form for tag interpolation is `<br></br>` / `<hr></hr>`.

**Autofixable** — each `<name/>` in the offending literal is rewritten to `<name></name>` in place. The rewrite is purely textual within the same string literal and never changes JSX structure.

## Rule details

Scope: the `defaultValue` of `t()`, `tolgee.t()`, and `<T>`, when it is a string `Literal` or a `TemplateLiteral` without `${...}` expressions.

### Failing examples

```jsx
t('k', 'Hi <br/>')
tolgee.t('k', '<br/>')
t({ key: 'k', defaultValue: 'Hi <br/>' })

;<T keyName="k" defaultValue="Hi <br/>" />
;<T keyName="k" defaultValue="<a/><b/>" />
;<T keyName="k" defaultValue={'<br/>'} />

// Custom interpolation tag names too
t('k', 'Use <custom-tag />')
```

### Passing examples

```jsx
t('k', 'Hello world')
t('k', 'Hi <br></br>')
t('k', 'Hi <b>x</b>')
tolgee.t('k', 'Hi <br></br>')
t({ key: 'k', defaultValue: 'Hi <br></br>' })

;<T keyName="k" defaultValue="Hi <br></br>" />

// The <T> JSX element being self-closing itself is NOT reported — only string content
;<T keyName="k" />

// Non-literal defaults — skipped (not statically analysable)
t('k', msg)
;<T keyName="k" defaultValue={msg} />

// Template literal with expressions — skipped
t('k', `Hi ${name} <br/>`)
```

## Autofix

Each `<name/>` match becomes `<name></name>`. Examples:

| Before                                            | After                                                |
| ------------------------------------------------- | ---------------------------------------------------- |
| `t('k', 'Hi <br/>')`                              | `t('k', 'Hi <br></br>')`                             |
| `<T keyName="k" defaultValue="<a/><b/>" />`       | `<T keyName="k" defaultValue="<a></a><b></b>" />`    |
| `t('k', 'Use <custom-tag />')`                    | `t('k', 'Use <custom-tag></custom-tag>')`            |

## Known limitations

- **Non-closing tags** (`<br>` with no matching `</br>`): out of scope for v1 — detecting this requires balanced-tag analysis. Tracked as follow-up.
- **Non-literal `defaultValue`** (variable reference, template literal with `${...}` expressions): skipped — not statically analysable.
- **Escaped tag syntax** (`"<br/>"` etc.): the rule matches against raw source text, so unicode-escaped tags are not detected. Don't write tags this way.
- **Tags with attributes** (`<br data-foo/>`): not detected. Tolgee interpolation tags don't carry attributes, so this is intentional.

## Message IDs

| ID               | When it fires                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `selfClosingTag` | A self-closing tag `<name/>` is present inside a Tolgee translation default-value literal. `{{name}}` is interpolated into the message. |

## References

- [Tags Interpolation | Tolgee (React)](https://docs.tolgee.io/js-sdk/integrations/react/tags-interpolation) — authoritative quote
- [Component interpolation | Tolgee (Vue)](https://docs.tolgee.io/js-sdk/integrations/vue/component-interpolation) — same limitation cross-framework
- [tolgee-js#3101 — Self closing tags are not supported](https://github.com/tolgee/tolgee-js/issues/3101)
