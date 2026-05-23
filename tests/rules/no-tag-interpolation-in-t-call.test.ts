import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/no-tag-interpolation-in-t-call.js'

run({
  name: 'no-tag-interpolation-in-t-call',
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
    { code: `tolgee.t('k', 'Hi {name}', { name: 'John' })` },
    { code: `t({ key: 'k', defaultValue: 'Hi {a}', params: { a: 1 } })` },
    { code: `<T keyName="k" defaultValue="Hi <br/>" params={{ br: <br /> }} />` },
    { code: `<T keyName="k" defaultValue="Hi <i>x</i>" params={{ i: <i /> }} />` },
    { code: `t('k', 'Hi <br/>', someParamsRef)` },
    { code: `t('k', 'Hi <br/>', { ...rest })` },
    { code: `t({ key: 'k', defaultValue: 'Hi <br/>', params: someParamsRef })` },
    { code: `notTolgee.t('k', 'Hi', { br: <br /> })` },
    { code: `t('k', 'Hi', { comment: 'ctx' })` },
  ],

  invalid: [
    {
      code: `t('k', 'Hi <br/>', { br: <br /> })`,
      errors: [{ messageId: 'tagInTCall' }],
    },
    {
      code: `tolgee.t('k', 'Hi <br/>', { br: <br /> })`,
      errors: [{ messageId: 'tagInTCall' }],
    },
    {
      code: `t({ key: 'k', defaultValue: 'Hi <br/>', params: { br: <br /> } })`,
      errors: [{ messageId: 'tagInTCall' }],
    },
    {
      code: `t('k', 'Hi <i>x</i>', { i: <i /> })`,
      errors: [{ messageId: 'tagInTCall' }],
    },
    {
      code: `t('k', 'Hi', { i: <></> })`,
      errors: [{ messageId: 'tagInTCall' }],
    },
    {
      code: `t('k', 'Hi <a>x</a> <b>y</b>', { a: <a />, b: <b /> })`,
      errors: [{ messageId: 'tagInTCall' }, { messageId: 'tagInTCall' }],
    },
  ],
})
