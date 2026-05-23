import type { Rule } from 'eslint'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer string arguments in t() function instead of object props',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/prefer-string-arguments.md',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferStringArguments:
        'Prefer using string arguments in t() function instead of object props. Use t(key, defaultValue) instead of t({ key, defaultValue })',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (
          (node.callee.type === 'Identifier' && node.callee.name === 't') ||
          (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'tolgee' &&
            node.callee.property.name === 't')
        ) {
          const arg = node.arguments[0]

          if (arg && arg.type === 'ObjectExpression') {
            const properties = arg.properties

            const keyProp = properties.find(
              (prop: any) =>
                prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'key',
            )

            const defaultValueProp = properties.find(
              (prop: any) =>
                prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'defaultValue',
            )

            if (keyProp && defaultValueProp) {
              const keyValue = keyProp.value.value

              let defaultValueText: string
              if (defaultValueProp.value.type === 'TemplateLiteral') {
                defaultValueText = context.sourceCode.getText(defaultValueProp.value)
              } else {
                defaultValueText = defaultValueProp.value.value
              }

              const otherProps = properties.filter(
                (prop: any) =>
                  prop.type === 'Property' &&
                  prop.key.type === 'Identifier' &&
                  prop.key.name !== 'key' &&
                  prop.key.name !== 'defaultValue',
              )

              const paramsProp = otherProps.find(
                (prop: any) =>
                  prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'params',
              )

              context.report({
                node,
                messageId: 'preferStringArguments',
                fix(fixer) {
                  const keyHasSingleQuote = keyValue && keyValue.includes("'")
                  const keyQuote = keyHasSingleQuote ? '"' : "'"

                  let defaultValuePart: string
                  if (defaultValueProp.value.type === 'TemplateLiteral') {
                    defaultValuePart = defaultValueText
                  } else {
                    const defaultValueHasSingleQuote = defaultValueText && defaultValueText.includes("'")
                    const defaultValueQuote = defaultValueHasSingleQuote ? '"' : "'"
                    defaultValuePart = `${defaultValueQuote}${defaultValueText}${defaultValueQuote}`
                  }

                  let fixedCode = `${keyQuote}${keyValue}${keyQuote}, ${defaultValuePart}`

                  if (otherProps.length > 0) {
                    if (paramsProp && paramsProp.value.type === 'ObjectExpression') {
                      const paramsContent = context.sourceCode
                        .getText()
                        .substring(paramsProp.value.range[0] + 1, paramsProp.value.range[1] - 1)
                        .trim()

                      const nonParamsProps = otherProps.filter((prop: any) => prop !== paramsProp)

                      if (nonParamsProps.length > 0) {
                        const nonParamsText = nonParamsProps
                          .map((prop: any) =>
                            context.sourceCode.getText().substring(prop.range[0], prop.range[1]),
                          )
                          .join(', ')

                        fixedCode += `, { ${paramsContent}${paramsContent ? ', ' : ''}${nonParamsText} }`
                      } else {
                        fixedCode += `, { ${paramsContent} }`
                      }
                    } else {
                      const otherPropsText = context.sourceCode
                        .getText()
                        .substring(otherProps[0].range[0], otherProps[otherProps.length - 1].range[1])

                      fixedCode += `, { ${otherPropsText} }`
                    }
                  }

                  return fixer.replaceText(arg, fixedCode)
                },
              })
            }
          }
        }
      },
    }
  },
}

export default rule
