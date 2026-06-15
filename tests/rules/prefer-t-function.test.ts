import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/prefer-t-function.js'

run({
  name: 'prefer-t-function',
  rule: rule as never,
  languageOptions: {
    parser: tseslintParser as never,
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },

  valid: [
    // 1. Tag interpolation in params
    {
      code: `function C() { return <T keyName="k" defaultValue="Hi <br></br>" params={{ br: <br /> }} /> }`,
    },
    // 2. Fragment param
    {
      code: `function C() { return <T keyName="k" defaultValue="x" params={{ nbsp: <>&nbsp;</> }} /> }`,
    },
    // 3. Class render() method
    {
      code: `class C extends Component { render() { return <T keyName="k" defaultValue="x" /> } }`,
    },
    // 4. Module-scope object literal
    { code: `const routes = [{ label: <T keyName="k" defaultValue="x" /> }]` },
    // 5. Plain lowercase function
    { code: `function validate() { return <T keyName="k" defaultValue="x" /> }` },
    // 6. ns prop
    { code: `function C() { return <T keyName="k" defaultValue="x" ns="other" /> }` },
    // 7. noWrap prop
    { code: `function C() { return <T keyName="k" defaultValue="x" noWrap /> }` },
    // 8. Spread props
    { code: `function C() { return <T keyName="k" {...rest} /> }` },
    // 9. Dynamic keyName
    { code: `function C() { return <T keyName={dynamic} defaultValue="x" /> }` },
    // 10. Template-literal default WITH expressions -> bail
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue={\`Hi \${name}\`} /> }`,
    },
    // 11. Lowercase-const arrow ('plain')
    { code: `const x = () => <T keyName="k" defaultValue="x" />` },
    // 12. Anonymous callback inside component
    {
      code: `function C() { const { t } = useTranslate(); return <>{items.map(() => <T keyName="k" defaultValue="x" />)}</> }`,
    },
    // 13. React.memo/HOC anonymous
    { code: `const Foo = React.memo(() => <T keyName="k" defaultValue="x" />)` },
    // 14. A plain t() call already present (no <T>)
    { code: `function C() { const { t } = useTranslate(); return t('k', 'x') }` },
    // 28. Arrow render-prop tag handler in params -> must stay <T>
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hi</p>" params={{ p: (chunks) => <p>{chunks}</p> }} /> }`,
    },
    // 29. Arrow render-prop with a TS-annotated parameter
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hi</p>" params={{ p: (chunks: ReactNode) => <p className="mb-[10px]">{chunks}</p> }} /> }`,
    },
    // 30. FunctionExpression tag handler in params
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<b>Hi</b>" params={{ b: function (chunks) { return <b>{chunks}</b> } }} /> }`,
    },
    // 31. Method-shorthand tag handler in params
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hi</p>" params={{ p(chunks) { return <p>{chunks}</p> } }} /> }`,
    },
    // 32. Spread in params -> contents unverifiable, stay <T>
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="Hi {name}" params={{ ...rest, name }} /> }`,
    },
  ],

  invalid: [
    // 15. No t in scope
    {
      code: `function C() { return <T keyName="foo" defaultValue="Hello" /> }`,
      output: null,
      errors: [{ messageId: 'preferTFunctionManual' }],
    },
    // 16. Shadowing, dangerous direction
    {
      code: `function C() { const { t } = useTranslate(); return inner(); function inner() { const t = somethingElse; return <T keyName="foo" defaultValue="x" /> } }`,
      output: null,
      errors: [{ messageId: 'preferTFunctionManual' }],
    },
    // 17. Shadowing, simple
    {
      code: `function C() { const t = somethingElse; return <T keyName="foo" defaultValue="x" /> }`,
      output: null,
      errors: [{ messageId: 'preferTFunctionManual' }],
    },
    // 18. Plain bare-attribute key/default, standalone return
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="foo" defaultValue="Hello" /> }`,
      output: `function C() { const { t } = useTranslate(); return t('foo', 'Hello') }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 19. Container-wrapped default
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="foo" defaultValue={'Hello'} /> }`,
      output: `function C() { const { t } = useTranslate(); return t('foo', 'Hello') }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 20. Container-wrapped key
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName={'foo'} defaultValue="Hello" /> }`,
      output: `function C() { const { t } = useTranslate(); return t('foo', 'Hello') }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 21. JSX-child position -> braces injected
    {
      code: `function C() { const { t } = useTranslate(); return <div><T keyName="foo" defaultValue="Hello" /></div> }`,
      output: `function C() { const { t } = useTranslate(); return <div>{t('foo', 'Hello')}</div> }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 22. Attribute-value position -> no extra braces
    {
      code: `function C() { const { t } = useTranslate(); return <div title={<T keyName="foo" defaultValue="Hi" />} /> }`,
      output: `function C() { const { t } = useTranslate(); return <div title={t('foo', 'Hi')} /> }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 23. Logical position -> no braces
    {
      code: `function C() { const { t } = useTranslate(); return <>{cond && <T keyName="foo" defaultValue="Hi" />}</> }`,
      output: `function C() { const { t } = useTranslate(); return <>{cond && t('foo', 'Hi')}</> }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 24. Conditional position -> no braces
    {
      code: `function C() { const { t } = useTranslate(); return <>{cond ? <T keyName="foo" defaultValue="Hi" /> : null}</> }`,
      output: `function C() { const { t } = useTranslate(); return <>{cond ? t('foo', 'Hi') : null}</> }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 25. Param-flatten FIX
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="foo" defaultValue="Hi {name}" params={{ name }} /> }`,
      output: `function C() { const { t } = useTranslate(); return t('foo', 'Hi {name}', { name }) }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 26. Quote escaping (default contains ')
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="foo" defaultValue="You don't have access" /> }`,
      output: `function C() { const { t } = useTranslate(); return t('foo', "You don't have access") }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
    // 27. Zero-expression template-literal default FIX, verbatim
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="foo" defaultValue={\`{count, plural, one {# item} other {# items}}\`} /> }`,
      output: `function C() { const { t } = useTranslate(); return t('foo', \`{count, plural, one {# item} other {# items}}\`) }`,
      errors: [{ messageId: 'preferTFunctionFixable' }],
    },
  ],
})
