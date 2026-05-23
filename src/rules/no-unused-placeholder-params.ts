import type { Rule } from 'eslint'

import { extractIcuPlaceholders } from '../utils/extractIcuPlaceholders.js'
import { isTComponent, isTranslationCall } from '../utils/isTranslationCall.js'

const RESERVED_META_KEYS = new Set(['comment'])

function getStaticString(node: any): string | null {
  if (!node) return null
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((q: any) => q.value.cooked ?? q.value.raw).join('')
  }
  return null
}

function getJsxStaticString(value: any): string | null {
  if (!value) return null
  if (value.type === 'Literal' && typeof value.value === 'string') return value.value
  if (value.type === 'JSXExpressionContainer') return getStaticString(value.expression)
  return null
}

function findObjectProperty(objectExpression: any, name: string): any {
  for (const prop of objectExpression.properties) {
    if (prop.type !== 'Property') continue
    if (prop.key?.type === 'Identifier' && prop.key.name === name) return prop
    if (prop.key?.type === 'Literal' && prop.key.value === name) return prop
  }
  return null
}

function hasSpread(objectExpression: any): boolean {
  for (const prop of objectExpression.properties) {
    if (prop.type === 'SpreadElement') return true
  }
  return false
}

function getPropertyKeyName(prop: any): string | null {
  if (prop.type !== 'Property') return null
  if (prop.key?.type === 'Identifier') return prop.key.name
  if (prop.key?.type === 'Literal' && typeof prop.key.value === 'string') return prop.key.value
  return null
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Report params object keys that are not referenced as ICU placeholders in `defaultValue`.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/no-unused-placeholder-params.md',
    },
    defaultOptions: [{ ignoreList: [] }],
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        description: 'Configuration options for the no-unused-placeholder-params rule.',
        properties: {
          ignoreList: {
            type: 'array',
            description:
              'Param key names to ignore when reporting unused params (in addition to the reserved Tolgee meta key `comment`).',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      unusedParam: "Param key '{{name}}' is not referenced in defaultValue.",
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const userIgnore = new Set<string>((context.options[0]?.ignoreList ?? []) as string[])
    const ignored = new Set<string>([...RESERVED_META_KEYS, ...userIgnore])

    function check(defaultValueText: string, paramsObject: any) {
      if (hasSpread(paramsObject)) return

      const placeholders = extractIcuPlaceholders(defaultValueText)

      for (const prop of paramsObject.properties) {
        const name = getPropertyKeyName(prop)
        if (name == null) continue
        if (ignored.has(name)) continue
        if (placeholders.has(name)) continue
        context.report({
          node: prop,
          messageId: 'unusedParam',
          data: { name },
        })
      }
    }

    return {
      CallExpression(node: any) {
        if (!isTranslationCall(node.callee)) return

        const arg0 = node.arguments[0]
        if (!arg0) return

        if (arg0.type === 'ObjectExpression') {
          const defaultProp = findObjectProperty(arg0, 'defaultValue')
          if (!defaultProp) return
          const defaultText = getStaticString(defaultProp.value)
          if (defaultText == null) return

          const paramsProp = findObjectProperty(arg0, 'params')
          if (paramsProp == null) return
          if (paramsProp.value.type !== 'ObjectExpression') return
          check(defaultText, paramsProp.value)
          return
        }

        const defaultArg = node.arguments[1]
        if (!defaultArg) return
        const defaultText = getStaticString(defaultArg)
        if (defaultText == null) return

        const paramsArg = node.arguments[2]
        if (paramsArg == null) return
        if (paramsArg.type !== 'ObjectExpression') return
        check(defaultText, paramsArg)
      },

      JSXOpeningElement(node: any) {
        if (!isTComponent(node.name)) return

        const defaultAttr = node.attributes.find(
          (a: any) => a.type === 'JSXAttribute' && a.name?.name === 'defaultValue',
        )
        if (!defaultAttr) return
        const defaultText = getJsxStaticString(defaultAttr.value)
        if (defaultText == null) return

        const paramsAttr = node.attributes.find(
          (a: any) => a.type === 'JSXAttribute' && a.name?.name === 'params',
        )
        if (!paramsAttr) return
        const expr = paramsAttr.value
        if (expr?.type !== 'JSXExpressionContainer') return
        if (expr.expression.type !== 'ObjectExpression') return
        check(defaultText, expr.expression)
      },
    }
  },
}

export default rule
