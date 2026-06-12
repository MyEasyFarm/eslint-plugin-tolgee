# `tolgee/prefer-t-function`

Flags `<T>` components that have a static key, a static default value, and **no tag interpolation in `params`** — situations where the `t()` function is fully equivalent. When a `const { t } = useTranslate()` binding is already in scope at the flagged site, the rule attaches an autofix; otherwise it reports the site for manual conversion.

The precondition matters: `<T>` remains **required** whenever `params` contains JSX elements (tag interpolation). This rule only touches sites where `t()` is a genuine drop-in replacement.

**Not in `recommended`** — opt-in only. See [When NOT to use](#when-not-to-use--known-limitations) below.

## When NOT to use / known limitations

- **Tag interpolation requires `<T>`**: if any `params` value is a JSX element or fragment (`params={{ br: <br /> }}`), the site is silently skipped. The complementary [`tolgee/no-tag-interpolation-in-t-call`](./no-tag-interpolation-in-t-call.md) rule enforces the inverse — never pass JSX to `t()`. These two rules are consistent: `<T>` is mandatory for tags; `t()` is preferred otherwise.
- **Deliberate under-reporting**: the following contexts are never reported even where a fix would be safe — this is an intentional v1 scope decision to avoid false positives:
  - Class components (`render()` methods and other class methods).
  - Module-scope array/object literals (e.g. route config arrays).
  - Plain (lowercase-named) functions.
  - Anonymous callbacks and HOC-wrapped components (e.g. `items.map(() => <T/>)`, `React.memo(() => <T/>)`).
- **Two message IDs, two tiers**: `preferTFunctionFixable` fires when a `const { t } = useTranslate()` destructure is innermost-in-scope and carries an autofix. `preferTFunctionManual` fires when no qualifying `t` binding is in scope — the site must be converted manually (this rule never injects `useTranslate()` or its import).
- **Not in `recommended`**: enable explicitly when you want to migrate `<T>` → `t()`. The `recommended` preset count remains seven rules unchanged.

## Rule details

### Failing examples

```jsx
// No t in scope — reported as preferTFunctionManual (no autofix)
function MyComponent() {
  return <T keyName="greeting" defaultValue="Hello" />
}

// t in scope — reported as preferTFunctionFixable (autofixed)
function MyComponent() {
  const { t } = useTranslate()
  return <T keyName="greeting" defaultValue="Hello" />
}

// JSX-child position — fix wraps in expression container
function MyComponent() {
  const { t } = useTranslate()
  return (
    <div>
      <T keyName="greeting" defaultValue="Hello" />
    </div>
  )
}

// Attribute-value position — no extra braces needed
function MyComponent() {
  const { t } = useTranslate()
  return <div title={<T keyName="greeting" defaultValue="Hello" />} />
}

// With non-JSX params — params contents are flattened into the third arg
function MyComponent() {
  const { t } = useTranslate()
  return <T keyName="greeting" defaultValue="Hi {name}" params={{ name }} />
}

// Default containing a single quote — switches to double-quote wrapper
function MyComponent() {
  const { t } = useTranslate()
  return <T keyName="access" defaultValue="You don't have access" />
}
```

### Passing examples

```jsx
// Tag interpolation in params — <T> is required, never reported
function MyComponent() {
  return <T keyName="k" defaultValue="Hi <br/>" params={{ br: <br /> }} />
}

// Fragment in params — <T> is required
function MyComponent() {
  return <T keyName="k" defaultValue="x" params={{ nbsp: <>&nbsp;</> }} />
}

// Class component — not reported (v1 limitation)
class MyComponent extends Component {
  render() {
    return <T keyName="k" defaultValue="Hello" />
  }
}

// Module-scope literal — not reported
const routes = [{ label: <T keyName="k" defaultValue="Home" /> }]

// Plain (lowercase) function — not reported
function validate() {
  return <T keyName="k" defaultValue="Required" />
}

// Anonymous callback inside component — not reported
function MyComponent() {
  const { t } = useTranslate()
  return <>{items.map(() => <T keyName="k" defaultValue="item" />)}</>
}

// ns, noWrap, language, or orEmpty props present — not reported (different semantics)
function MyComponent() {
  return <T keyName="k" defaultValue="Hello" ns="admin" />
}

// Dynamic keyName — not reported (let no-dynamic-key handle it)
function MyComponent() {
  return <T keyName={dynamicKey} defaultValue="Hello" />
}

// Template literal default with expressions — not reported (ICU semantics would drift)
function MyComponent() {
  const { t } = useTranslate()
  return <T keyName="k" defaultValue={`Hi ${name}`} />
}
```

## Options

This rule has no options.

## Message IDs

| ID                       | When it fires                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `preferTFunctionFixable` | The `<T>` has a static key/default and no tag interpolation, and a `const { t } = useTranslate()` binding is innermost-in-scope. Carries an autofix. |
| `preferTFunctionManual`  | The `<T>` has a static key/default and no tag interpolation, but no qualifying `t` binding is in scope. Must be converted manually.            |

## References

- [Tags Interpolation | Tolgee](https://docs.tolgee.io/js-sdk/integrations/react/tags-interpolation) — why `<T>` is required for tag interpolation
- [Translating | Tolgee](https://docs.tolgee.io/js-sdk/integrations/react/translating) — `useTranslate()` and `t()` usage
- [`tolgee/no-tag-interpolation-in-t-call`](./no-tag-interpolation-in-t-call.md) — the complementary rule: disallows JSX in `t()` params
