import { createHash } from 'node:crypto'

import type { Rule } from 'eslint'

import { isTComponent, isTranslationCall } from '../utils/isTranslationCall.js'

function createShortHash(input: string): string {
  const hash = createHash('sha512').update(input).digest('base64')
  const cleanedHash = hash.replace(/[^a-zA-Z0-9/W+]/g, '')
  return cleanedHash.slice(0, 6)
}

function checkPropNames(arr: Array<string | undefined>, val: string): boolean {
  return arr.some((arrVal) => val === arrVal)
}

function getDefaultValue(arg: any): string | number | boolean | null | undefined {
  if (arg.type === 'Literal') {
    return arg.value
  } else if (arg.type === 'TemplateLiteral') {
    return arg.quasis[0].value.cooked
  }
  return undefined
}

function getDefaultValueJSX(arg: any): string | number | boolean | null | undefined {
  if (!arg) return undefined
  if (arg.type === 'Literal') {
    return arg.value
  } else if (arg.type === 'JSXExpressionContainer') {
    if (arg.expression.type === 'Literal') {
      return arg.expression.value
    } else if (arg.expression.type === 'TemplateLiteral') {
      return arg.expression.quasis[0].value.cooked
    }
  }
  return undefined
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure `t()` or `tolgee.t()` has a translation key and `<T>` has `keyName`.',
      url: 'https://github.com/MyEasyFarm/eslint-plugin-tolgee/blob/main/docs/rules/require-key.md',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingObjectKeyProp:
        'Translation function must have a non-empty key prop inside props object',
      missingObjectDefaultValueProp:
        'Translation function must have a non-empty defaultValue prop inside props object',
      invalidObjectKeyValueProp:
        'Translation function key prop inside props object must be valid hash value',
      missingLiteralKeyProp: 'Translation function must have a non-empty key arg',
      missingLiteralDefaultValueProp: 'Translation function must have a non-empty defaultValue arg',
      invalidLiteralKeyValueProp: 'Translation function key arg must be valid hash value',
      missingKeyInComponent: '`<T>` must have a non-empty `keyName` prop.',
      missingDefaultValueInComponent: '`<T>` must have a non-empty `defaultValue` prop.',
      invalidKeyInComponent: '`<T>` `keyName` prop must be valid hash value',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (isTranslationCall(node.callee)) {
          const arg = node.arguments[0]
          if (arg && (arg.type === 'Literal' || arg.type === 'TemplateLiteral')) {
            const literalProps = node.arguments?.filter(
              (a: any) => a.type === 'Literal' || a.type === 'TemplateLiteral',
            )
            const paramsField = node.arguments?.filter((a: any) => a.type === 'ObjectExpression')
            const commentField = paramsField.length
              ? paramsField[0].properties.filter(
                  (a: any) => a.type === 'Property' && a.key.name === 'comment',
                )
              : []
            const commentValue = commentField.length ? commentField[0].value.value : ''
            if (literalProps.length < 2) {
              const templateLiteralValue = getDefaultValue(arg)
              if (templateLiteralValue) {
                context.report({
                  node,
                  messageId: 'missingLiteralKeyProp',
                  fix(fixer) {
                    const insertPos = arg.range[0]
                    return fixer.insertTextBeforeRange(
                      [insertPos, insertPos],
                      `'${createShortHash(`${templateLiteralValue}${commentValue}`)}', `,
                    )
                  },
                })
              } else {
                context.report({
                  node,
                  messageId: 'missingLiteralDefaultValueProp',
                })
              }
            }
            if (literalProps.length === 2) {
              const literalKeyValue = (arg.value as string).trim()
              const literalDefaultMessageValue = getDefaultValue(node.arguments[1])
              const literalValueToHash = `${literalDefaultMessageValue}${commentValue}`
              const literalDefaultMessageHashValue = literalValueToHash
                ? createShortHash(literalValueToHash)
                : ''

              if (!literalKeyValue) {
                context.report({
                  node,
                  messageId: 'missingLiteralKeyProp',
                  fix(fixer) {
                    const insertPos = arg.range
                    return fixer.replaceTextRange(
                      [insertPos[0], insertPos[1]],
                      `'${literalDefaultMessageHashValue}'`,
                    )
                  },
                })
              } else {
                if (literalKeyValue !== literalDefaultMessageHashValue) {
                  context.report({
                    node,
                    messageId: 'invalidLiteralKeyValueProp',
                    fix(fixer) {
                      const insertPos = arg.range
                      return fixer.replaceTextRange(
                        [insertPos[0], insertPos[1]],
                        `'${literalDefaultMessageHashValue}'`,
                      )
                    },
                  })
                }
              }
            }
          }
          if (arg && arg.type === 'ObjectExpression') {
            const objectPropNames = arg.properties?.map((a: any) => a.key.name)
            const defaultMessageIndex = objectPropNames.indexOf('defaultValue')
            const defaultMessageValue =
              defaultMessageIndex !== -1
                ? getDefaultValue(arg.properties[defaultMessageIndex].value)
                : ''
            const paramsField = arg.properties?.filter((a: any) => a.key.name === 'params')
            const commentField = paramsField.length
              ? paramsField[0].value.properties.filter(
                  (a: any) => a.type === 'Property' && a.key.name === 'comment',
                )
              : []
            const commentValue = commentField.length ? commentField[0].value.value : ''
            const objectValueToHash = `${defaultMessageValue}${commentValue}`
            const objectDefaultMessageHashValue = objectValueToHash
              ? createShortHash(objectValueToHash)
              : ''

            if (!checkPropNames(objectPropNames, 'defaultValue')) {
              context.report({
                node,
                messageId: 'missingObjectDefaultValueProp',
              })
            }
            if (!checkPropNames(objectPropNames, 'key')) {
              context.report({
                node,
                messageId: 'missingObjectKeyProp',
                fix(fixer) {
                  const insertPos = arg.properties[0].range[0]
                  return fixer.insertTextBeforeRange(
                    [insertPos, insertPos],
                    `key: '${objectDefaultMessageHashValue}', `,
                  )
                },
              })
            }
            if (checkPropNames(objectPropNames, 'key')) {
              const objectKeyIndex = objectPropNames.indexOf('key')
              const objectKeyValue = (arg.properties[objectKeyIndex].value.value as string).trim()

              if (!objectKeyValue) {
                context.report({
                  node,
                  messageId: 'missingObjectKeyProp',
                  fix(fixer) {
                    const insertPos = arg.properties[objectKeyIndex].value.range
                    return fixer.replaceTextRange(
                      [insertPos[0], insertPos[1]],
                      `'${objectDefaultMessageHashValue}'`,
                    )
                  },
                })
              }
              if (objectKeyValue && objectKeyValue !== objectDefaultMessageHashValue) {
                context.report({
                  node,
                  messageId: 'invalidObjectKeyValueProp',
                  fix(fixer) {
                    const insertPos = arg.properties[objectKeyIndex].value.range
                    return fixer.replaceTextRange(
                      [insertPos[0], insertPos[1]],
                      `'${objectDefaultMessageHashValue}'`,
                    )
                  },
                })
              }
            }
          }
        }
      },

      JSXOpeningElement(node: any) {
        if (isTComponent(node.name)) {
          const propNames = node.attributes?.map((a: any) => a.name?.name)
          const defaultMessageIndex = propNames.indexOf('defaultValue')
          const defaultMessageValue =
            defaultMessageIndex !== -1
              ? getDefaultValueJSX(node.attributes[defaultMessageIndex].value)
              : ''
          const paramsField = node.attributes?.filter((a: any) => a.name?.name === 'params')
          const commentField = paramsField.length
            ? paramsField[0].value.expression.properties.filter(
                (a: any) => a.type === 'Property' && a.key.name === 'comment',
              )
            : []
          const commentValue = commentField.length ? commentField[0].value.value : ''
          const valueToHash = `${defaultMessageValue}${commentValue}`
          const defaultMessageHashValue = valueToHash ? createShortHash(valueToHash) : ''

          if (!checkPropNames(propNames, 'defaultValue')) {
            context.report({
              node,
              messageId: 'missingDefaultValueInComponent',
            })
          }

          if (!checkPropNames(propNames, 'keyName')) {
            context.report({
              node,
              messageId: 'missingKeyInComponent',
              fix(fixer) {
                const insertPos = node.name.range[1]
                return fixer.insertTextBeforeRange(
                  [insertPos, insertPos],
                  ` keyName="${defaultMessageHashValue}"`,
                )
              },
            })
          }
          if (checkPropNames(propNames, 'keyName')) {
            const keyIndex = propNames.indexOf('keyName')
            const keyValue = (node.attributes[keyIndex].value.value as string).trim()

            if (!keyValue) {
              context.report({
                node,
                messageId: 'missingKeyInComponent',
                fix(fixer) {
                  const insertPos = node.attributes[keyIndex].value.range
                  return fixer.replaceTextRange(
                    [insertPos[0], insertPos[1]],
                    `"${defaultMessageHashValue}"`,
                  )
                },
              })
            }
            if (keyValue && keyValue !== defaultMessageHashValue) {
              context.report({
                node,
                messageId: 'invalidKeyInComponent',
                fix(fixer) {
                  const insertPos = node.attributes[keyIndex].value.range
                  return fixer.replaceTextRange(
                    [insertPos[0], insertPos[1]],
                    `"${defaultMessageHashValue}"`,
                  )
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
