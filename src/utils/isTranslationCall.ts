export function isTranslationCall(callee: any): boolean {
  return (
    (callee.type === 'Identifier' && callee.name === 't') ||
    (callee.type === 'MemberExpression' &&
      callee.object.name === 'tolgee' &&
      callee.property.name === 't')
  )
}

export function isTComponent(jsxName: any): boolean {
  return jsxName.type === 'JSXIdentifier' && jsxName.name === 'T'
}
