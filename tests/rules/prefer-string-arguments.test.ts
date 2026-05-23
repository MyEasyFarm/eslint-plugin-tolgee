import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/prefer-string-arguments.js'

run({
  name: 'prefer-string-arguments',
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
    { code: `t('abc123', 'Hello world')` },
    { code: `tolgee.t('abc123', 'Hello world')` },
    { code: `t('abc123', 'Hello, {name}!', { name: 'John' })` },
    { code: `t('abc123', 'This is a test', { comment: 'Context for translators' })` },
  ],

  invalid: [
    {
      code: `t({ key: 'abc123', defaultValue: 'Hello world' })`,
      output: `t('abc123', 'Hello world')`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
    {
      code: `tolgee.t({ key: 'abc123', defaultValue: 'Hello world' })`,
      output: `tolgee.t('abc123', 'Hello world')`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
    {
      code: `t({ key: 'abc123', defaultValue: 'Hello, {name}!', params: { name: 'John' } })`,
      output: `t('abc123', 'Hello, {name}!', { name: 'John' })`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
    {
      code: `t({ key: 'abc123', defaultValue: 'This is a test', params: { comment: 'Context for translators' } })`,
      output: `t('abc123', 'This is a test', { comment: 'Context for translators' })`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
    {
      code: `t({ key: 'wmyg6t', defaultValue: 'Resource' })`,
      output: `t('wmyg6t', 'Resource')`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
    {
      code: `t({ key: 'fQy3nx', defaultValue: "You don't have access to this feature" })`,
      output: `t('fQy3nx', "You don't have access to this feature")`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
    {
      code: `t({
    key: 'VFR3c0',
    defaultValue: \`{freq, select,
      returned {Always returned}
      3of4 {Buried 3 times out of 4}
      2of3 {Buried twice out of 3}
      1in2 {Buried 1 in 2}
      1in3 {Buried 1 in 3}
      1in4 {Buried 1 in 4}
      exported {Always exported}
      other {0}}\`,
    params: { freq: FREQ_KEYS[frequencyIndex] || '' },
  })`,
      output: `t('VFR3c0', \`{freq, select,
      returned {Always returned}
      3of4 {Buried 3 times out of 4}
      2of3 {Buried twice out of 3}
      1in2 {Buried 1 in 2}
      1in3 {Buried 1 in 3}
      1in4 {Buried 1 in 4}
      exported {Always exported}
      other {0}}\`, { freq: FREQ_KEYS[frequencyIndex] || '' })`,
      errors: [{ messageId: 'preferStringArguments' }],
    },
  ],
})
