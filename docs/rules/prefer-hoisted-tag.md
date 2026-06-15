# `tolgee/prefer-hoisted-tag`

Flags a `<T>` whose **entire message is a single presentational wrapper tag** that is re-supplied through `params`, and prefers hoisting that tag out of the translation — translating plain text with `t()` instead.

```jsx
// flagged — the whole message is one wrapper tag, supplied back through params
<T
  keyName="ly5u1b"
  defaultValue="<p>On this step you need to provide data on weather for your farm.</p>"
  params={{ p: <p className="mb-[10px]" /> }}
/>

// preferred — wrapper lives in code, translation is plain text
<p className="mb-[10px]">{t('ly5u1b', 'On this step you need to provide data on weather for your farm.')}</p>
```

Presentational markup (a layout tag plus its `className`) does not belong in a translation string. Hoisting it leaves translators with plain text — nothing to reorder, drop, or break — and turns the call site into a plain `t()` returning a string: no `<T>`, no `params`, no tag-interpolation machinery.

This rule is the deliberate complement of [`tolgee/prefer-t-function`](./prefer-t-function.md), which **skips** any `<T>` carrying a tag param. This rule fires on exactly the subset of those where the tag is a pure whole-message wrapper, converting it into the `t()` form `prefer-t-function` already prefers. The two rules are disjoint by construction and never both fire on the same site.

**Not in `recommended`** — opt-in only. It is an i18n/style preference whose fix has an out-of-band step (see below), so it should not block CI.

## ⚠️ Applying the fix requires a paired Tolgee data migration

`t('KEY', default)` returns the **stored** translation for the active locale; the `default` argument is only a missing-key fallback. The flagged `<T>` currently stores `<p>…</p>` (with the tag) as the value of `KEY` in **every locale**. If you hoist the tag in code **without** updating the stored data, `t('KEY', …)` returns the stored `<p>…</p>` string, which React then renders as **escaped raw markup** (the literal text `<p>…</p>`) for every un-migrated locale.

So applying the transform must be paired with a Tolgee migration: strip the wrapper tag from the stored value of `KEY` (or let the key regenerate and re-translate as plain text). Because ESLint cannot see or verify stored translation data, the rule **never autofixes by default** — it offers the transform as an editor *suggestion*, and the migration requirement is stated in both the report message and the suggestion description.

## What it flags

A `<T>` (or `prop={<T … />}`) is reported only when **all** hold:

1. `keyName` and `defaultValue` are static strings.
2. It is inside a component (uppercase-named function). A `const { t } = useTranslate()` binding in scope makes the report carry a suggestion/fix; with no `t` in scope it is reported for manual conversion (`preferHoistedTagManual`).
3. No `ns` / `noWrap` / `language` / `orEmpty` props, no spread props, and no spread in `params` (different semantics / not statically verifiable).
4. `params` is an object literal with **exactly one** property, key `W`, whose value is a **pure wrapper**: a childless `<W …props />`, or a render-prop `(chunks) => <W …props>{chunks}</W>` whose body returns a single element whose only child is the chunk identifier.
5. The **rendered element tag equals the message tag name equals the param key** (`EL === W`). A divergent case like `params={{ p: <span /> }}` is left untouched.
6. The trimmed `defaultValue` is exactly `<W>INNER</W>` — the wrapper spans the whole message and the message tag carries **no attributes**.
7. `INNER` contains no further tags (`<`) and no ICU placeholder (`{`).

## What it does NOT flag

These genuinely need in-message interpolation — there is no single tag to hoist:

```jsx
// Multiple block tags
<T keyName="k" defaultValue="<p>a</p><p>b</p>" params={{ p: <p /> }} />

// Inline tag inside a sentence — the tag is not a whole-message wrapper
<T keyName="k" defaultValue="Has <a>link</a> here" params={{ a: <a /> }} />

// Non-pure wrapper — the render-prop injects extra content around {chunks}
<T keyName="k" defaultValue="<p>x</p>" params={{ p: (chunks) => <p>extra {chunks}</p> }} />

// Rendered element tag differs from the message tag name
<T keyName="k" defaultValue="<p>X</p>" params={{ p: <span /> }} />

// Attributes on the message wrapper tag
<T keyName="k" defaultValue="<p class='lead'>X</p>" params={{ p: <p /> }} />

// ICU placeholder inside the message
<T keyName="k" defaultValue="<p>Hi {name}</p>" params={{ p: <p /> }} />

// ns / noWrap / language / orEmpty present, spread props, or more than one param
```

## Options

```js
'tolgee/prefer-hoisted-tag': ['warn', {
  autofix: false,                                                  // default
  tags: ['p', 'span', 'div', 'b', 'strong', 'em', 'small', 'label', 'a'],
}]
```

| Option    | Type       | Default                                                       | Description                                                                                                                                  |
| --------- | ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `autofix` | `boolean`  | `false`                                                       | When `false`, the transform is offered as an editor **suggestion** only. When `true`, it becomes a plain `--fix` — enable only if your `--fix` runs are paired with the Tolgee data migration described above. |
| `tags`    | `string[]` | `['p','span','div','b','strong','em','small','label','a']`    | Wrapper tags to consider, matched against the **rendered element** tag. An empty array means any tag.                                          |

## Message IDs

| ID                       | When it fires                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `preferHoistedTag`       | A pure whole-message wrapper with a `t` binding in scope. Carries a suggestion (or an autofix when `autofix: true`).    |
| `hoistSuggestion`        | The suggestion description shown on apply; states the paired Tolgee-migration requirement.                            |
| `preferHoistedTagManual` | A pure whole-message wrapper but no `t` binding is in scope — convert manually (and migrate the stored value).         |

## References

- [Tags Interpolation | Tolgee](https://docs.tolgee.io/js-sdk/integrations/react/tags-interpolation) — how `<T>` interpolates tags via `params`
- [`tolgee/prefer-t-function`](./prefer-t-function.md) — the complementary rule this one extends
- [`tolgee/no-tag-interpolation-in-t-call`](./no-tag-interpolation-in-t-call.md) — keep JSX out of `t()`
