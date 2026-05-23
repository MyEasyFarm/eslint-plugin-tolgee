# `tolgee/no-tag-interpolation-in-t-call`

Disallows JSX/React-element values inside the `params` object of `t()` / `tolgee.t()` calls. Per Tolgee's [v5 React migration guide](https://docs.tolgee.io/js-sdk/5.x.x/migration_to_v5/react):

> Tags interpolation is now supported only with the `<T>` component and not with the `t` function. The types for the t function were too complicated as it could return string or react component based on input.

When a JSX element is passed via `params` to `t()`, the tag does not get interpolated — `t()` returns the raw default value with the literal `<br/>` text instead of a `<br>` DOM node. Use the `<T>` component for tag interpolation.

**Not autofixable** — `t()` is commonly used in non-JSX contexts (e.g. `title={t(...)}`, template literals), so an automatic rewrite to `<T>` would break code.

## Rule details

### Failing examples

```jsx
// JSX element value in third-arg params
t('k', 'Hi <br/>', { br: <br /> })
tolgee.t('k', 'Hi <br/>', { br: <br /> })

// JSX element value in object-form params
t({ key: 'k', defaultValue: 'Hi <br/>', params: { br: <br /> } })

// JSX fragment also reported
t('k', 'Hi', { i: <></> })

// Multiple JSX values — each reported
t('k', 'Hi <a>x</a> <b>y</b>', { a: <a />, b: <b /> })
```

### Passing examples

```jsx
// Tag interpolation belongs on the <T> component
;<T keyName="k" defaultValue="Hi <br/>" params={{ br: <br /> }} />

// Plain values are fine
t('k', 'Hi {name}', { name: 'John' })
t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1 } })

// Non-literal params reference — not statically analysable, skipped
t('k', 'Hi <br/>', someParamsRef)

// Spread — skipped (may resolve at runtime)
t('k', 'Hi <br/>', { ...rest })
```

## Known limitations

- **Non-object params** (variable references, function-call results): skipped — the rule can only inspect literal object expressions.
- **Function values returning JSX** (e.g. `{ b: (c) => <b>{c}</b> }`): not flagged in this version. Tolgee also supports this functional form of tag interpolation, but a static check produces too many false positives on functions that legitimately return nodes for other reasons.
- **Spread in params** (`{ ...rest }`): properties before/after the spread are still scanned; the spread itself is opaque.

## Message IDs

| ID            | When it fires                                                                       |
| ------------- | ----------------------------------------------------------------------------------- |
| `tagInTCall`  | A property in a `t()` / `tolgee.t()` `params` object has a `JSXElement` / `JSXFragment` value. |

## References

- [Migrating to v5 (React) | Tolgee](https://docs.tolgee.io/js-sdk/5.x.x/migration_to_v5/react) — authoritative restriction
- [Translating | Tolgee](https://docs.tolgee.io/js-sdk/integrations/react/translating) — "If you want to use Tags interpolation, use the T component."
- [Tags Interpolation | Tolgee](https://docs.tolgee.io/js-sdk/integrations/react/tags-interpolation)
- [tolgee-js#3337](https://github.com/tolgee/tolgee-js/issues/3337) — TS-level evidence: `useTranslate` param type excludes `JSX.Element`.
