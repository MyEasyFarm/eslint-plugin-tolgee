import type { Rule } from 'eslint'

import { isTComponent, isTranslationCall } from '../utils/isTranslationCall.js'

const SELF_CLOSING_TAG_RE = /<([A-Za-z_][A-Za-z0-9_-]*)\s*\/>/g

function findObjectProperty(objectExpression: any, name: string): any {
  for (const prop of objectExpression.properties) {
    if (prop.type !== 'Property') continue
    if (prop.key?.type === 'Identifier' && prop.key.name === name) return prop
    if (prop.key?.type === 'Literal' && prop.key.value === name) return prop
  }
  return null
}

function isStaticStringLiteral(node: any): boolean {
  if (!node) return false
  if (node.type === 'Literal' && typeof node.value === 'string') return true
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return true
  return false
}

function getJsxStringAttrValueNode(value: any): any {
  if (!value) return null
  if (value.type === 'Literal' && typeof value.value === 'string') return value
  if (value.type === 'JSXExpressionContainer' && isStaticStringLiteral(value.expression)) {
    return value.expression
  }
  return null
}

function reportSelfClosingTags(context: Rule.RuleContext, node: any): void {
  const sourceCode = context.sourceCode
  const raw = sourceCode.getText(node)
  let match: RegExpExecArray | null
  SELF_CLOSING_TAG_RE.lastIndex = 0
  while ((match = SELF_CLOSING_TAG_RE.exec(raw)) !== null) {
    const tagName = match[1]
    const start = node.range[0] + match.index
    const end = start + match[0].length
    context.report({
      loc: {
        start: sourceCode.getLocFromIndex(start),
        end: sourceCode.getLocFromIndex(end),
      },
      messageId: 'selfClosingTag',
      data: { name: tagName },
      fix: (fixer) => fixer.replaceTextRange([start, end], `<${tagName}></${tagName}>`),
    })
  }
}

function checkDefaultValueNode(context: Rule.RuleContext, node: any): void {
  if (!isStaticStringLiteral(node)) return
  reportSelfClosingTags(context, node)
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Disallow self-closing tag syntax (`<name/>`) inside Tolgee translation default values — Tolgee does not parse self-closing tags, use `<name></name>` instead.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/no-self-closing-tags.md',
    },
    schema: [],
    messages: {
      selfClosingTag:
        'Self-closing tag `<{{name}}/>` is not parsed by Tolgee — use `<{{name}}></{{name}}>` instead.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (!isTranslationCall(node.callee)) return

        const arg0 = node.arguments[0]
        if (!arg0) return

        if (arg0.type === 'ObjectExpression') {
          const defaultProp = findObjectProperty(arg0, 'defaultValue')
          if (defaultProp) checkDefaultValueNode(context, defaultProp.value)
          return
        }

        const defaultArg = node.arguments[1]
        if (defaultArg) checkDefaultValueNode(context, defaultArg)
      },

      JSXOpeningElement(node: any) {
        if (!isTComponent(node.name)) return

        const defaultAttr = node.attributes.find(
          (a: any) => a.type === 'JSXAttribute' && a.name?.name === 'defaultValue',
        )
        if (!defaultAttr) return

        const valueNode = getJsxStringAttrValueNode(defaultAttr.value)
        if (valueNode) reportSelfClosingTags(context, valueNode)
      },
    }
  },
}

export default rule
