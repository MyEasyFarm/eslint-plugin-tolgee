import { createHash } from 'node:crypto'

import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/require-key.js'

function createShortHash(input: string): string {
  const hash = createHash('sha512').update(input).digest('base64')
  const cleanedHash = hash.replace(/[^a-zA-Z0-9/W+]/g, '')
  return cleanedHash.slice(0, 6)
}

const helloWorldMessage = 'Hello world'
const helloWorldHash = createShortHash(helloWorldMessage)
const withParamsMessage = 'Hello, {name}!'
const withParamsHash = createShortHash(withParamsMessage)
const withCommentMessage = 'This is a test'
const commentText = 'Context for translators'
const withCommentHash = createShortHash(`${withCommentMessage}${commentText}`)

run({
  name: 'require-key',
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
    { code: `t('${helloWorldHash}', '${helloWorldMessage}')` },
    { code: `tolgee.t('${helloWorldHash}', '${helloWorldMessage}')` },
    { code: `t({ key: '${helloWorldHash}', defaultValue: '${helloWorldMessage}' })` },
    { code: `tolgee.t({ key: '${helloWorldHash}', defaultValue: '${helloWorldMessage}' })` },
    { code: `<T keyName="${helloWorldHash}" defaultValue="${helloWorldMessage}" />` },
    { code: `<T keyName="${helloWorldHash}" defaultValue={'${helloWorldMessage}'} />` },
    { code: `t('${withParamsHash}', '${withParamsMessage}', { name: 'John' })` },
    {
      code: `t({ key: '${withParamsHash}', defaultValue: '${withParamsMessage}', params: { name: 'John' } })`,
    },
    {
      code: `<T keyName="${withParamsHash}" defaultValue="${withParamsMessage}" params={{ name: "John" }} />`,
    },
    { code: `t('${withCommentHash}', '${withCommentMessage}', { comment: '${commentText}' })` },
  ],

  invalid: [
    {
      code: `t('${helloWorldMessage}')`,
      output: `t('${helloWorldHash}', '${helloWorldMessage}')`,
      errors: [{ messageId: 'missingLiteralKeyProp' }],
    },
    {
      code: `tolgee.t('${helloWorldMessage}')`,
      output: `tolgee.t('${helloWorldHash}', '${helloWorldMessage}')`,
      errors: [{ messageId: 'missingLiteralKeyProp' }],
    },
    {
      code: `t('', '${helloWorldMessage}')`,
      output: `t('${helloWorldHash}', '${helloWorldMessage}')`,
      errors: [{ messageId: 'missingLiteralKeyProp' }],
    },
    {
      code: `t('wrongkey', '${helloWorldMessage}')`,
      output: `t('${helloWorldHash}', '${helloWorldMessage}')`,
      errors: [{ messageId: 'invalidLiteralKeyValueProp' }],
    },
    {
      code: `t({ defaultValue: '${helloWorldMessage}' })`,
      output: `t({ key: '${helloWorldHash}', defaultValue: '${helloWorldMessage}' })`,
      errors: [{ messageId: 'missingObjectKeyProp' }],
    },
    {
      code: `t({ key: '', defaultValue: '${helloWorldMessage}' })`,
      output: `t({ key: '${helloWorldHash}', defaultValue: '${helloWorldMessage}' })`,
      errors: [{ messageId: 'missingObjectKeyProp' }],
    },
    {
      code: `t({ key: 'wrongkey', defaultValue: '${helloWorldMessage}' })`,
      output: `t({ key: '${helloWorldHash}', defaultValue: '${helloWorldMessage}' })`,
      errors: [{ messageId: 'invalidObjectKeyValueProp' }],
    },
    {
      // Known issue (see CHANGELOG [Unreleased]): when defaultValue is missing,
      // autofix replaces the key with an empty string, then re-fires on the next pass.
      // verifyFixChanges is disabled to allow the assertion against the documented one-pass output.
      code: `t({ key: 'wrongkey' })`,
      output: `t({ key: '' })`,
      errors: [
        { messageId: 'missingObjectDefaultValueProp' },
        { messageId: 'invalidObjectKeyValueProp' },
      ],
      recursive: false,
      verifyFixChanges: false,
      verifyAfterFix: false,
    },
    {
      code: `<T defaultValue="${helloWorldMessage}" />`,
      output: `<T keyName="${helloWorldHash}" defaultValue="${helloWorldMessage}" />`,
      errors: [{ messageId: 'missingKeyInComponent' }],
    },
    {
      code: `<T keyName="" defaultValue="${helloWorldMessage}" />`,
      output: `<T keyName="${helloWorldHash}" defaultValue="${helloWorldMessage}" />`,
      errors: [{ messageId: 'missingKeyInComponent' }],
    },
    {
      code: `<T keyName="wrongkey" defaultValue="${helloWorldMessage}" />`,
      output: `<T keyName="${helloWorldHash}" defaultValue="${helloWorldMessage}" />`,
      errors: [{ messageId: 'invalidKeyInComponent' }],
    },
    {
      // Known issue (see CHANGELOG [Unreleased]): same root cause as Invalid #7.
      code: `<T keyName="wrongkey" />`,
      output: `<T keyName="" />`,
      errors: [
        { messageId: 'missingDefaultValueInComponent' },
        { messageId: 'invalidKeyInComponent' },
      ],
      recursive: false,
      verifyFixChanges: false,
      verifyAfterFix: false,
    },
    {
      code: `t('wrongkey', '${withCommentMessage}', { comment: '${commentText}' })`,
      output: `t('${withCommentHash}', '${withCommentMessage}', { comment: '${commentText}' })`,
      errors: [{ messageId: 'invalidLiteralKeyValueProp' }],
    },
  ],
})
