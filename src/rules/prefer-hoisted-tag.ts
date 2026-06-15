import type { Rule } from 'eslint'

import { isTComponent } from '../utils/isTranslationCall.js'
import {
  findAttribute,
  findUseTranslateT,
  getComponentContext,
  isStaticString,
} from '../utils/tComponent.js'

const DEFAULT_TAGS = ['p', 'span', 'div', 'b', 'strong', 'em', 'small', 'label', 'a']

// The single param key (e.g. `p` in params={{ p: ... }}) that names the message
// tag, or null if the params object isn't a single statically-named property.
function getSingleParamKey(paramsObj: any): string | null {
  if (paramsObj.properties.length !== 1) return null
  const prop = paramsObj.properties[0]
  if (prop.type !== 'Property') return null
  if (prop.key.type === 'Identifier' && !prop.computed) return prop.key.name
  if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') return prop.key.value
  return null
}

// True when the element has no children other than whitespace text.
function isChildless(el: any): boolean {
  return !el.children?.some(
    (child: any) => !(child.type === 'JSXText' && child.value.trim() === ''),
  )
}

// Returns the wrapper JSXElement if `value` is a "pure wrapper" — a childless
// element `<W …/>`, or a render-prop `(chunks) => <W …>{chunks}</W>` whose body
// returns a single element whose only child is the chunk identifier. Else null.
function getPureWrapperElement(value: any): any {
  if (value?.type === 'JSXElement') {
    return isChildless(value) ? value : null
  }

  if (value?.type === 'ArrowFunctionExpression' || value?.type === 'FunctionExpression') {
    if (value.params.length !== 1 || value.params[0].type !== 'Identifier') return null
    const chunkName = value.params[0].name

    let returned: any = null
    if (value.body.type === 'JSXElement') {
      returned = value.body
    } else if (value.body.type === 'BlockStatement') {
      const statements = value.body.body
      if (statements.length !== 1 || statements[0].type !== 'ReturnStatement') return null
      returned = statements[0].argument
    }
    if (returned?.type !== 'JSXElement') return null

    const children = returned.children.filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === ''),
    )
    if (children.length !== 1) return null
    const only = children[0]
    if (
      only.type !== 'JSXExpressionContainer' ||
      only.expression.type !== 'Identifier' ||
      only.expression.name !== chunkName
    ) {
      return null
    }
    return returned
  }

  return null
}

// If `message` (the trimmed default value) is exactly an attribute-free wrapper
// `<W>INNER</W>` spanning the whole string, with INNER free of further tags
// (`<`) and ICU placeholders (`{`), returns INNER. Otherwise null.
function extractWholeMessageInner(message: string, w: string): string | null {
  const trimmed = message.trim()
  const open = `<${w}>`
  const close = `</${w}>`
  if (!trimmed.startsWith(open) || !trimmed.endsWith(close)) return null
  if (trimmed.length < open.length + close.length) return null
  const inner = trimmed.slice(open.length, trimmed.length - close.length)
  if (inner.includes('<') || inner.includes('{')) return null
  return inner
}

function quote(raw: string): string {
  const q = raw.includes("'") ? '"' : "'"
  return `${q}${raw}${q}`
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer hoisting a whole-message wrapper tag out of a <T> and translating plain text with t(), instead of embedding the tag in the message and re-supplying it via params.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/prefer-hoisted-tag.md',
    },
    fixable: 'code',
    hasSuggestions: true,
    defaultOptions: [{ autofix: false, tags: DEFAULT_TAGS }],
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        description: 'Configuration options for the prefer-hoisted-tag rule.',
        properties: {
          autofix: {
            type: 'boolean',
            description:
              'Promote the hoist from a suggestion to a plain --fix. Off by default because applying it requires a paired Tolgee data migration.',
          },
          tags: {
            type: 'array',
            description:
              'Wrapper tags to consider. Empty array means any tag. Filters on the rendered element tag.',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      preferHoistedTag:
        "The whole <{{tag}}> message is a wrapper tag — hoist it into code and translate plain text with t(). Applying the fix requires migrating the stored Tolgee value for '{{key}}' to plain text, or non-default locales will render the raw <{{tag}}> tags.",
      hoistSuggestion:
        "Hoist the <{{tag}}> wrapper into code and translate plain text with t() (then migrate the stored Tolgee value for '{{key}}' to plain text).",
      preferHoistedTagManual:
        "The whole <{{tag}}> message is a wrapper tag — hoist it into code and translate plain text with t() from useTranslate(). No t binding is in scope here, so convert manually; also migrate the stored Tolgee value for '{{key}}' to plain text.",
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = (context.options[0] ?? {}) as { autofix?: boolean; tags?: string[] }
    const autofix = options.autofix === true
    const tags = options.tags ?? DEFAULT_TAGS

    return {
      JSXOpeningElement(node: any) {
        if (!isTComponent(node.name)) return

        const el = node.parent

        // 1. Children present (a wrapper <T> carries its message in defaultValue)
        if (!isChildless(el)) return

        // 2. Spread props
        if (node.attributes.some((a: any) => a.type === 'JSXSpreadAttribute')) return

        // 3. ns / noWrap / language / orEmpty — different semantics
        if (
          findAttribute(node, 'ns') ||
          findAttribute(node, 'noWrap') ||
          findAttribute(node, 'language') ||
          findAttribute(node, 'orEmpty')
        ) {
          return
        }

        // 4. Static keyName
        const keyAttr = findAttribute(node, 'keyName')
        if (!keyAttr || !keyAttr.value) return
        const keyNode =
          keyAttr.value.type === 'JSXExpressionContainer' ? keyAttr.value.expression : keyAttr.value
        if (!isStaticString(keyNode)) return

        // 5. params: object literal with exactly one statically-named property
        const paramsAttr = findAttribute(node, 'params')
        if (!paramsAttr) return
        const paramsObj =
          paramsAttr.value?.type === 'JSXExpressionContainer' ? paramsAttr.value.expression : null
        if (paramsObj?.type !== 'ObjectExpression') return
        const w = getSingleParamKey(paramsObj)
        if (!w) return

        // 6. That single param is a pure wrapper element
        const wrapperEl = getPureWrapperElement((paramsObj.properties[0] as any).value)
        if (!wrapperEl) return
        const elName = wrapperEl.openingElement.name
        if (elName.type !== 'JSXIdentifier') return
        const tag = elName.name

        // 7. EL === W (rendered element tag must equal the message tag name)
        if (tag !== w) return

        // 8. tags filter (empty = any), on the rendered element tag
        if (tags.length > 0 && !tags.includes(tag)) return

        // 9. Static defaultValue that is exactly <W>INNER</W>, attribute-free,
        //    INNER free of further tags and ICU placeholders
        const dvAttr = findAttribute(node, 'defaultValue')
        if (!dvAttr || !dvAttr.value) return
        const dv =
          dvAttr.value.type === 'JSXExpressionContainer' ? dvAttr.value.expression : dvAttr.value
        if (!isStaticString(dv)) return
        const dvText = dv.type === 'TemplateLiteral' ? dv.quasis[0].value.cooked : dv.value
        const inner = extractWholeMessageInner(String(dvText), w)
        if (inner === null) return

        // 10. Component context
        if (getComponentContext(node) !== 'component') return

        const keyRaw = keyNode.type === 'Literal' ? keyNode.value : keyNode.quasis[0].value.cooked
        const data = { tag, key: String(keyRaw) }

        const variable = findUseTranslateT(context, node)
        if (!variable) {
          context.report({ node: el, messageId: 'preferHoistedTagManual', data })
          return
        }

        const fix = (fixer: Rule.RuleFixer) => {
          const propsText = wrapperEl.openingElement.attributes
            .map((a: any) => context.sourceCode.getText(a))
            .join(' ')
          const open = propsText ? `<${tag} ${propsText}>` : `<${tag}>`
          const expr = `t(${quote(String(keyRaw))}, ${quote(inner)})`
          return fixer.replaceText(el, `${open}{${expr}}</${tag}>`)
        }

        context.report({
          node: el,
          messageId: 'preferHoistedTag',
          data,
          ...(autofix ? { fix } : { suggest: [{ messageId: 'hoistSuggestion', data, fix }] }),
        })
      },
    }
  },
}

export default rule
