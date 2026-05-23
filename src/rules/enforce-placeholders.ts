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

function analyzeParamsObject(objectExpression: any): { keys: Set<string>; hasSpread: boolean } {
  const keys = new Set<string>()
  let hasSpread = false
  for (const prop of objectExpression.properties) {
    if (prop.type === 'SpreadElement') {
      hasSpread = true
      continue
    }
    if (prop.type !== 'Property') continue
    if (prop.key?.type === 'Identifier') {
      keys.add(prop.key.name)
    } else if (prop.key?.type === 'Literal' && typeof prop.key.value === 'string') {
      keys.add(prop.key.value)
    }
  }
  return { keys, hasSpread }
}

function findObjectProperty(objectExpression: any, name: string): any {
  for (const prop of objectExpression.properties) {
    if (prop.type !== 'Property') continue
    if (prop.key?.type === 'Identifier' && prop.key.name === name) return prop
    if (prop.key?.type === 'Literal' && prop.key.value === name) return prop
  }
  return null
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ensure every ICU placeholder referenced in `defaultValue` has a matching key in the params object.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/enforce-placeholders.md',
    },
    defaultOptions: [{ ignoreList: [] }],
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        description: 'Configuration options for the enforce-placeholders rule.',
        properties: {
          ignoreList: {
            type: 'array',
            description:
              'Placeholder names to ignore (in addition to the reserved Tolgee meta key `comment`).',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      missingParamsObject:
        'Translation message references placeholders but no params object was provided.',
      missingPlaceholderKey: 'Missing value for placeholder `{{name}}` in translation params.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const userIgnore = new Set<string>((context.options[0]?.ignoreList ?? []) as string[])
    const ignored = new Set<string>([...RESERVED_META_KEYS, ...userIgnore])

    function check(
      reportNode: any,
      paramsReportNode: any,
      defaultValueText: string,
      paramsObject: any | null,
    ) {
      const placeholders = extractIcuPlaceholders(defaultValueText)
      const required: string[] = []
      for (const name of placeholders) {
        if (!ignored.has(name)) required.push(name)
      }
      if (required.length === 0) return

      if (paramsObject == null) {
        context.report({ node: reportNode, messageId: 'missingParamsObject' })
        return
      }

      const { keys, hasSpread } = analyzeParamsObject(paramsObject)
      if (hasSpread) return

      for (const name of required) {
        if (!keys.has(name)) {
          context.report({
            node: paramsReportNode,
            messageId: 'missingPlaceholderKey',
            data: { name },
          })
        }
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
          if (paramsProp == null) {
            check(node, node, defaultText, null)
          } else if (paramsProp.value.type === 'ObjectExpression') {
            check(node, paramsProp.value, defaultText, paramsProp.value)
          }
          return
        }

        const defaultArg = node.arguments[1]
        if (!defaultArg) return
        const defaultText = getStaticString(defaultArg)
        if (defaultText == null) return

        const paramsArg = node.arguments[2]
        if (paramsArg == null) {
          check(node, node, defaultText, null)
          return
        }
        if (paramsArg.type !== 'ObjectExpression') return
        check(node, paramsArg, defaultText, paramsArg)
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
        if (!paramsAttr) {
          check(node, node, defaultText, null)
          return
        }
        const expr = paramsAttr.value
        if (expr?.type !== 'JSXExpressionContainer') return
        if (expr.expression.type !== 'ObjectExpression') return
        check(node, expr.expression, defaultText, expr.expression)
      },
    }
  },
}

export default rule
