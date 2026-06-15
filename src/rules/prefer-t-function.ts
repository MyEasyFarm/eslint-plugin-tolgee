import type { Rule } from 'eslint'

import { isTComponent } from '../utils/isTranslationCall.js'
import {
  findAttribute,
  findUseTranslateT,
  getComponentContext,
  isStaticString,
} from '../utils/tComponent.js'

function isTagParam(node: any): boolean {
  return (
    node?.type === 'JSXElement' ||
    node?.type === 'JSXFragment' ||
    node?.type === 'ArrowFunctionExpression' ||
    node?.type === 'FunctionExpression'
  )
}

function isJsxChild(el: any): boolean {
  const p = el.parent
  return (
    (p.type === 'JSXElement' || p.type === 'JSXFragment') &&
    Array.isArray(p.children) &&
    p.children.includes(el)
  )
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer the t() function over the <T> component when the <T> has a static key/default and no tag interpolation.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/prefer-t-function.md',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferTFunctionFixable:
        "This <T> has no tag interpolation and a static key/default — t('{{key}}', ...) is equivalent here and matches the codebase's dominant t() usage.",
      preferTFunctionManual:
        'This <T> has no tag interpolation and a static key/default — prefer t() from useTranslate(). No t binding is in scope here, so this must be converted manually.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      JSXOpeningElement(node: any) {
        if (!isTComponent(node.name)) return

        const el = node.parent

        // 1. Children present
        const hasNonWhitespaceChild = el.children?.some(
          (child: any) => !(child.type === 'JSXText' && child.value.trim() === ''),
        )
        if (hasNonWhitespaceChild) return

        // 2. Spread props
        if (node.attributes.some((a: any) => a.type === 'JSXSpreadAttribute')) return

        // 3. ns prop
        if (findAttribute(node, 'ns')) return

        // 4. noWrap / language / orEmpty props
        if (
          findAttribute(node, 'noWrap') ||
          findAttribute(node, 'language') ||
          findAttribute(node, 'orEmpty')
        ) {
          return
        }

        // 5. Missing or dynamic keyName
        const keyAttr = findAttribute(node, 'keyName')
        if (!keyAttr || !keyAttr.value) return
        const keyNode =
          keyAttr.value.type === 'JSXExpressionContainer' ? keyAttr.value.expression : keyAttr.value
        if (!isStaticString(keyNode)) return

        // 6. JSX in params
        const paramsAttr = findAttribute(node, 'params')
        let paramsObj: any = null
        if (paramsAttr) {
          paramsObj =
            paramsAttr.value?.type === 'JSXExpressionContainer' ? paramsAttr.value.expression : null
          if (paramsObj?.type !== 'ObjectExpression') return
          // Bail on any param that can't be statically flattened into a t() scalar
          // arg: a tag handler (JSX element/fragment or a render-prop function) or a
          // spread (SpreadElement, whose contents can't be verified). <T> stays.
          if (paramsObj.properties.some((p: any) => p.type !== 'Property' || isTagParam(p.value))) {
            return
          }
        }

        // 7. Non-static defaultValue
        const dvAttr = findAttribute(node, 'defaultValue')
        if (!dvAttr || !dvAttr.value) return
        const dv =
          dvAttr.value.type === 'JSXExpressionContainer' ? dvAttr.value.expression : dvAttr.value
        if (!isStaticString(dv)) return

        // 8. Non-component context
        if (getComponentContext(node) !== 'component') return

        const variable = findUseTranslateT(context, node)

        if (!variable) {
          context.report({ node: el, messageId: 'preferTFunctionManual' })
          return
        }

        const keyRaw = keyNode.type === 'Literal' ? keyNode.value : keyNode.quasis[0].value.cooked

        context.report({
          node: el,
          messageId: 'preferTFunctionFixable',
          data: { key: String(keyRaw) },
          fix(fixer) {
            const keyQuote = String(keyRaw).includes("'") ? '"' : "'"
            const keyText = `${keyQuote}${keyRaw}${keyQuote}`

            let defaultText: string
            if (dv.type === 'TemplateLiteral') {
              defaultText = context.sourceCode.getText(dv)
            } else {
              const defaultQuote = String(dv.value).includes("'") ? '"' : "'"
              defaultText = `${defaultQuote}${dv.value}${defaultQuote}`
            }

            let expr = `t(${keyText}, ${defaultText})`
            if (paramsObj) {
              const paramsContent = context.sourceCode
                .getText()
                .substring(paramsObj.range[0] + 1, paramsObj.range[1] - 1)
                .trim()
              expr = `t(${keyText}, ${defaultText}, { ${paramsContent} })`
            }

            const replacement = isJsxChild(el) ? `{${expr}}` : expr
            return fixer.replaceText(el, replacement)
          },
        })
      },
    }
  },
}

export default rule
