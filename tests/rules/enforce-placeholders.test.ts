import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/enforce-placeholders.js'

run({
  name: 'enforce-placeholders',
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
    { code: `t('k', 'Hello world')` },
    { code: `t('k', 'Hi {name}!', { name: 'John' })` },
    { code: `tolgee.t('k', 'Hi {name}!', { name: 'John' })` },
    { code: `t('k', 'Hi', { comment: 'ctx' })` },
    { code: `t('k', 'Hi {a}', { a: 1, comment: 'ctx' })` },
    { code: `t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1 } })` },
    { code: `<T keyName="k" defaultValue="Hi {a}" params={{ a: 1 }} />` },
    { code: `t('k', '{count, plural, one {one} other {#}}', { count: 1 })` },
    { code: `t('k', '{a} {b}', { a: 1, b: 2 })` },
    { code: "t('k', `Hi {a}`, { a: 1 })" },
    { code: `t('k', msg)` },
    { code: "t('k', `${prefix} {a}`, { a: 1 })" },
    { code: `t('k', 'Hi {a}', { ...rest })` },
    { code: `t('k', 'Hi {a} {b}', { ...rest, a: 1 })` },
    {
      code: `t('k', 'Hi {foo}', {})`,
      options: [{ ignoreList: ['foo'] }],
    },
    { code: `notTolgee.t('k', 'Hi {a}')` },
    { code: `<T keyName="k" defaultValue="Hello world" />` },
    { code: `<T keyName="k" defaultValue="Hi {a}" params={someParams} />` },
  ],

  invalid: [
    {
      code: `t('k', 'Hi {name}!')`,
      errors: [{ messageId: 'missingParamsObject' }],
    },
    {
      code: `t('k', 'Hi {name}', { comment: 'ctx' })`,
      errors: [{ messageId: 'missingPlaceholderKey', data: { name: 'name' } }],
    },
    {
      code: `t('k', 'Hi {a} {b}', { a: 1 })`,
      errors: [{ messageId: 'missingPlaceholderKey', data: { name: 'b' } }],
    },
    {
      code: `t({ key: 'k', defaultValue: 'Hi {n}' })`,
      errors: [{ messageId: 'missingParamsObject' }],
    },
    {
      code: `t({ key: 'k', defaultValue: 'Hi {a} {b}', params: { a: 1 } })`,
      errors: [{ messageId: 'missingPlaceholderKey', data: { name: 'b' } }],
    },
    {
      code: `<T keyName="k" defaultValue="Hi {n}" />`,
      errors: [{ messageId: 'missingParamsObject' }],
    },
    {
      code: `<T keyName="k" defaultValue="Hi {a} {b}" params={{ a: 1 }} />`,
      errors: [{ messageId: 'missingPlaceholderKey', data: { name: 'b' } }],
    },
    {
      code: `t('k', '{count, plural, one {one} other {#}}', {})`,
      errors: [{ messageId: 'missingPlaceholderKey', data: { name: 'count' } }],
    },
    {
      code: `tolgee.t('k', 'Hi {name}!')`,
      errors: [{ messageId: 'missingParamsObject' }],
    },
  ],
})
