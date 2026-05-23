import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/no-self-closing-tags.js'

run({
  name: 'no-self-closing-tags',
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
    { code: `t('k', 'Hi <br></br>')` },
    { code: `t('k', 'Hi <b>x</b>')` },
    { code: `tolgee.t('k', 'Hi <br></br>')` },
    { code: `t({ key: 'k', defaultValue: 'Hi <br></br>' })` },
    { code: `<T keyName="k" defaultValue="Hi <br></br>" />` },
    { code: `<T keyName="k" defaultValue={msg} />` },
    { code: `t('k', msg)` },
    { code: "t('k', `Hi ${name} <br/>`)" },
    { code: `<T keyName="k" />` },
    { code: `notTolgee.t('k', 'Hi <br/>')` },
    { code: `<NotT defaultValue="Hi <br/>" />` },
  ],

  invalid: [
    {
      code: `t('k', 'Hi <br/>')`,
      output: `t('k', 'Hi <br></br>')`,
      errors: [{ messageId: 'selfClosingTag', data: { name: 'br' } }],
    },
    {
      code: `tolgee.t('k', '<br/>')`,
      output: `tolgee.t('k', '<br></br>')`,
      errors: [{ messageId: 'selfClosingTag', data: { name: 'br' } }],
    },
    {
      code: `t({ key: 'k', defaultValue: 'Hi <br/>' })`,
      output: `t({ key: 'k', defaultValue: 'Hi <br></br>' })`,
      errors: [{ messageId: 'selfClosingTag', data: { name: 'br' } }],
    },
    {
      code: `<T keyName="k" defaultValue="Hi <br/>" />`,
      output: `<T keyName="k" defaultValue="Hi <br></br>" />`,
      errors: [{ messageId: 'selfClosingTag', data: { name: 'br' } }],
    },
    {
      code: `<T keyName="k" defaultValue="<a/><b/>" />`,
      output: `<T keyName="k" defaultValue="<a></a><b></b>" />`,
      errors: [
        { messageId: 'selfClosingTag', data: { name: 'a' } },
        { messageId: 'selfClosingTag', data: { name: 'b' } },
      ],
    },
    {
      code: `<T keyName="k" defaultValue={'<br/>'} />`,
      output: `<T keyName="k" defaultValue={'<br></br>'} />`,
      errors: [{ messageId: 'selfClosingTag', data: { name: 'br' } }],
    },
    {
      code: "t('k', `Hi <br/>`)",
      output: "t('k', `Hi <br></br>`)",
      errors: [{ messageId: 'selfClosingTag', data: { name: 'br' } }],
    },
    {
      code: `t('k', 'Use <custom-tag />')`,
      output: `t('k', 'Use <custom-tag></custom-tag>')`,
      errors: [{ messageId: 'selfClosingTag', data: { name: 'custom-tag' } }],
    },
  ],
})
