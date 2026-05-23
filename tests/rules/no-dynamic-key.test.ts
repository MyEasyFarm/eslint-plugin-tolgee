import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/no-dynamic-key.js'

run({
  name: 'no-dynamic-key',
  rule: rule as never,
  languageOptions: {
    parser: tseslintParser as never,
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },

  valid: [
    { code: `t('abc', 'Hello')` },
    { code: 't(`abc`, \'Hello\')' },
    { code: `tolgee.t('abc', 'Hello')` },
    { code: `t({ key: 'abc', defaultValue: 'Hello' })` },
    { code: 't({ key: `abc`, defaultValue: \'Hello\' })' },
    { code: `<T keyName="abc" defaultValue="Hello" />` },
    { code: `<T keyName={'abc'} defaultValue="Hello" />` },
    { code: '<T keyName={`abc`} defaultValue="Hello" />' },
    { code: `t()` },
    { code: `t({ ...rest, defaultValue: 'x' })` },
    { code: `notTolgee.t(KEY)` },
  ],

  invalid: [
    {
      code: `t(KEY, 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: 't(`pre-${id}`, \'Hello\')',
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: `t(getKey(), 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: `t('a' + b, 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: `t(cond ? 'a' : 'b', 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: `t(KEY as const, 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: `t(KEYS.greeting, 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },
    {
      code: `tolgee.t(KEY, 'Hello')`,
      errors: [{ messageId: 'dynamicKeyInCall' }],
    },

    {
      code: `t({ key: KEY, defaultValue: 'Hello' })`,
      errors: [{ messageId: 'dynamicKeyInObject' }],
    },
    {
      code: 't({ key: `pre-${id}`, defaultValue: \'Hello\' })',
      errors: [{ messageId: 'dynamicKeyInObject' }],
    },
    {
      code: `t({ ...rest, key: KEY })`,
      errors: [{ messageId: 'dynamicKeyInObject' }],
    },
    {
      code: `t({ key: KEYS.greeting, defaultValue: 'Hello' })`,
      errors: [{ messageId: 'dynamicKeyInObject' }],
    },

    {
      code: `<T keyName={KEY} defaultValue="Hello" />`,
      errors: [{ messageId: 'dynamicKeyInComponent' }],
    },
    {
      code: '<T keyName={`pre-${id}`} defaultValue="Hello" />',
      errors: [{ messageId: 'dynamicKeyInComponent' }],
    },
    {
      code: `<T keyName={getKey()} defaultValue="Hello" />`,
      errors: [{ messageId: 'dynamicKeyInComponent' }],
    },
    {
      code: `<T keyName={cond ? 'a' : 'b'} defaultValue="Hello" />`,
      errors: [{ messageId: 'dynamicKeyInComponent' }],
    },
    {
      code: `<T keyName={KEYS.greeting} defaultValue="Hello" />`,
      errors: [{ messageId: 'dynamicKeyInComponent' }],
    },
  ],
})
