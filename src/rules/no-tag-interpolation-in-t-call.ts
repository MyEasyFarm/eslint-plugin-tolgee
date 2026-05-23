import type { Rule } from 'eslint'

import { isTranslationCall } from '../utils/isTranslationCall.js'

function findObjectProperty(objectExpression: any, name: string): any {
  for (const prop of objectExpression.properties) {
    if (prop.type !== 'Property') continue
    if (prop.key?.type === 'Identifier' && prop.key.name === name) return prop
    if (prop.key?.type === 'Literal' && prop.key.value === name) return prop
  }
  return null
}

function isJsxValue(node: any): boolean {
  return node?.type === 'JSXElement' || node?.type === 'JSXFragment'
}

function checkParamsObject(context: Rule.RuleContext, paramsObject: any): void {
  for (const prop of paramsObject.properties) {
    if (prop.type !== 'Property') continue
    if (isJsxValue(prop.value)) {
      context.report({
        node: prop.value,
        messageId: 'tagInTCall',
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow JSX/React-element values in the `params` object of `t()` / `tolgee.t()` calls — tag interpolation is supported only by the `<T>` component.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/no-tag-interpolation-in-t-call.md',
    },
    schema: [],
    messages: {
      tagInTCall:
        'Tag interpolation in `params` is supported only by the `<T>` component, not by `t()` / `tolgee.t()`. Use `<T params={{ ... }} />` instead.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (!isTranslationCall(node.callee)) return

        const arg0 = node.arguments[0]
        if (!arg0) return

        if (arg0.type === 'ObjectExpression') {
          const paramsProp = findObjectProperty(arg0, 'params')
          if (paramsProp?.value?.type === 'ObjectExpression') {
            checkParamsObject(context, paramsProp.value)
          }
          return
        }

        const paramsArg = node.arguments[2]
        if (paramsArg?.type === 'ObjectExpression') {
          checkParamsObject(context, paramsArg)
        }
      },
    }
  },
}

export default rule
