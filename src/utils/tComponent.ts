import type { Rule } from 'eslint'

export function isStaticString(node: any): boolean {
  if (node.type === 'Literal' && typeof node.value === 'string') return true
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return true
  return false
}

export function findAttribute(node: any, name: string): any {
  return node.attributes.find((a: any) => a.type === 'JSXAttribute' && a.name?.name === name)
}

export function getComponentContext(
  node: any,
): 'component' | 'class' | 'module' | 'plain' | 'uncertain' {
  let current = node.parent
  let nearestFunction = true
  let sawFunction = false
  while (current) {
    if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
      return 'class'
    }
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      sawFunction = true
      let name: string | null = null
      if (current.id?.type === 'Identifier') {
        name = current.id.name
      } else if (
        current.parent?.type === 'VariableDeclarator' &&
        current.parent.id?.type === 'Identifier'
      ) {
        name = current.parent.id.name
      }
      // Nearest enclosing function must be named; an anonymous nearest
      // function (inline callback / HOC arg) is undecidable -> bail.
      if (name === null) {
        if (nearestFunction) return 'uncertain'
      } else {
        const first = name.charAt(0)
        // An uppercase-named function anywhere in the enclosing chain marks
        // a component context; a lowercase nested helper defers to an outer
        // component if one exists.
        if (first >= 'A' && first <= 'Z') return 'component'
      }
      nearestFunction = false
    }
    current = current.parent
  }
  return sawFunction ? 'plain' : 'module'
}

function isUseTranslateBinding(variable: any): boolean {
  return variable.defs.some(
    (def: any) =>
      def.node.type === 'VariableDeclarator' &&
      def.node.id.type === 'ObjectPattern' &&
      def.node.id.properties.some(
        (p: any) =>
          p.type === 'Property' &&
          ((p.key.type === 'Identifier' && p.key.name === 't') ||
            (p.value.type === 'Identifier' && p.value.name === 't')),
      ) &&
      def.node.init?.type === 'CallExpression' &&
      def.node.init.callee.type === 'Identifier' &&
      def.node.init.callee.name === 'useTranslate',
  )
}

export function findUseTranslateT(context: Rule.RuleContext, node: any): any {
  let scope: any = context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.variables.find((v: any) => v.name === 't')
    if (variable) {
      return isUseTranslateBinding(variable) ? variable : null
    }
    scope = scope.upper
  }
  return null
}
