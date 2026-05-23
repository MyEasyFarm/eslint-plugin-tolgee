import type { Rule } from 'eslint'

import { isTComponent, isTranslationCall } from '../utils/isTranslationCall.js'

function isLiteralKey(node: any): boolean {
  if (node.type === 'Literal' && typeof node.value === 'string') return true
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return true
  return false
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a string literal as the translation key — variables, member expressions, and dynamic templates are not allowed.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/no-dynamic-key.md',
    },
    schema: [],
    messages: {
      dynamicKeyInCall: 'Translation key must be a string literal.',
      dynamicKeyInObject: 'Translation `key` property must be a string literal.',
      dynamicKeyInComponent: '`<T>` `keyName` prop must be a string literal.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (!isTranslationCall(node.callee)) return
        const first = node.arguments[0]
        if (!first) return

        if (first.type !== 'ObjectExpression') {
          if (!isLiteralKey(first)) {
            context.report({ node: first, messageId: 'dynamicKeyInCall' })
          }
          return
        }

        for (const prop of first.properties) {
          if (prop.type !== 'Property') continue
          if (prop.key?.type !== 'Identifier' || prop.key.name !== 'key') continue
          if (!isLiteralKey(prop.value)) {
            context.report({ node: prop.value, messageId: 'dynamicKeyInObject' })
          }
        }
      },

      JSXOpeningElement(node: any) {
        if (!isTComponent(node.name)) return
        const attr = node.attributes.find(
          (a: any) => a.type === 'JSXAttribute' && a.name?.name === 'keyName',
        )
        if (!attr || !attr.value) return
        if (attr.value.type === 'Literal') return
        if (attr.value.type === 'JSXExpressionContainer') {
          if (isLiteralKey(attr.value.expression)) return
          context.report({ node: attr.value, messageId: 'dynamicKeyInComponent' })
        }
      },
    }
  },
}

export default rule
