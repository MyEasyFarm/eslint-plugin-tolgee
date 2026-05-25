import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/no-unused-placeholder-params.js'

run({
  name: 'no-unused-placeholder-params',
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
    { code: `t('k', 'Hi {name}', { name: 'John' })` },
    { code: `t('k', 'Hi {a} {b}', { a: 1, b: 2 })` },
    { code: `tolgee.t('k', 'Hi {name}', { name: 'John' })` },
    { code: `t('k', 'Hi', { comment: 'ctx' })` },
    { code: `t('k', 'Hi {a}', { a: 1, comment: 'ctx' })` },
    { code: `t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1 } })` },
    { code: `<T keyName="k" defaultValue="Hi {a}" params={{ a: 1 }} />` },
    { code: `t('k', '{count, plural, one {one} other {#}}', { count: 1 })` },
    {
      code: `t('k', '{allCount, select, 0 {0 items} other {{currentCount} of {allCount}}}', { currentCount: 1, allCount: 2 })`,
    },
    {
      code: `t('k', '{n, plural, one {# item} other {# items {count}}}', { n: 1, count: 2 })`,
    },
    { code: `<T keyName="k" defaultValue="Draw <br></br> on map" params={{ br: 1 }} />` },
    {
      code: `<T keyName="k" defaultValue="Click <a>here</a> to <b>continue</b>" params={{ a: 1, b: 2 }} />`,
    },
    {
      code: `t('k', 'Hi {a}', { a: 1, brand: 'X' })`,
      options: [{ ignoreList: ['brand'] }],
    },
    { code: `t('k', 'Hi {a}', { ...rest })` },
    { code: `t('k', 'Hi {a}', { ...rest, b: 2 })` },
    { code: `t('k', msg, { a: 1 })` },
    { code: `t('k', 'Hi', someParams)` },
    { code: `<T keyName="k" defaultValue="Hi {a}" params={someParams} />` },
    { code: `notTolgee.t('k', 'Hello', { name: 'X' })` },
  ],

  invalid: [
    {
      code: `t('k', 'Hello', { name: 'X' })`,
      errors: [{ messageId: 'unusedParam', data: { name: 'name' } }],
    },
    {
      code: `t('k', 'Hi {a}', { a: 1, b: 2 })`,
      errors: [{ messageId: 'unusedParam', data: { name: 'b' } }],
    },
    {
      code: `t('k', 'Hi', { a: 1, b: 2 })`,
      errors: [
        { messageId: 'unusedParam', data: { name: 'a' } },
        { messageId: 'unusedParam', data: { name: 'b' } },
      ],
    },
    {
      code: `t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1, x: 2 } })`,
      errors: [{ messageId: 'unusedParam', data: { name: 'x' } }],
    },
    {
      code: `<T keyName="k" defaultValue="Hi {a}" params={{ a: 1, x: 2 }} />`,
      errors: [{ messageId: 'unusedParam', data: { name: 'x' } }],
    },
    {
      code: `tolgee.t('k', 'Hello', { name: 'X' })`,
      errors: [{ messageId: 'unusedParam', data: { name: 'name' } }],
    },
  ],
})
