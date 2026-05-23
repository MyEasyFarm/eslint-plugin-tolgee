// Fixture for smoke test — should trigger both rules.
// Missing key → require-tolgee-key should fire.
const a = t('Hello world')

// Object form → prefer-string-arguments should fire.
const b = t({ key: 'abc123', defaultValue: 'Hello world' })

// Correct usage — no diagnostics expected.
const c = t('abc123', 'Hello world')

// JSX <T> without keyName → require-key should fire.
const d = <T defaultValue="Hello world" />

// Dynamic identifier key → no-dynamic-key should fire.
const e = t(KEY, 'Hello world')
