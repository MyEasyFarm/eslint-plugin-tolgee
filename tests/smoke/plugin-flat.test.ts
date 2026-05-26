import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import * as tseslintParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'

import plugin from '../../src/index.js'

const fixturePath = fileURLToPath(new URL('../fixtures/smoke.tsx', import.meta.url))
const fixture = readFileSync(fixturePath, 'utf8')

describe('plugin (flat config smoke test)', () => {
  it('exposes meta, rules, and recommended config', () => {
    expect(plugin.meta.name).toBe('@myeasyfarm/eslint-plugin-tolgee')
    expect(plugin.meta.version).toBe('0.2.3')
    expect(plugin.rules).toHaveProperty('require-key')
    expect(plugin.rules).toHaveProperty('prefer-string-arguments')
    expect(plugin.rules).toHaveProperty('no-dynamic-key')
    expect(plugin.configs.recommended).toBeDefined()
    expect(plugin.configs.recommended.name).toBe('tolgee/recommended')
  })

  it('exposes a spreadable recommended config', () => {
    const consumer: Linter.Config = {
      ...plugin.configs.recommended,
      name: 'consumer/override',
      files: ['src/**/*.ts'],
    }
    expect(consumer.name).toBe('consumer/override')
    expect(consumer.files).toEqual(['src/**/*.ts'])
    expect(consumer.plugins?.tolgee).toBe(plugin)
    expect(consumer.rules?.['tolgee/require-key']).toBe('error')
  })

  it('fires diagnostics on a fixture using flat config', () => {
    const linter = new Linter()
    const messages = linter.verify(fixture, {
      plugins: {
        tolgee: plugin as never,
      },
      languageOptions: {
        parser: tseslintParser as never,
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      rules: {
        'tolgee/require-key': 'error',
        'tolgee/prefer-string-arguments': 'error',
        'tolgee/no-dynamic-key': 'error',
      },
    })

    const ruleIds = messages.map((m) => m.ruleId)
    expect(ruleIds).toContain('tolgee/require-key')
    expect(ruleIds).toContain('tolgee/prefer-string-arguments')
    expect(ruleIds).toContain('tolgee/no-dynamic-key')
    expect(messages.length).toBeGreaterThanOrEqual(4)
  })
})
