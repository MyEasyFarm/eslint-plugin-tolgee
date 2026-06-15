import * as tseslintParser from '@typescript-eslint/parser'
import { run } from 'eslint-vitest-rule-tester'

import rule from '../../src/rules/prefer-hoisted-tag.js'

const HOIST_DESC =
  "Hoist the <p> wrapper into code and translate plain text with t() (then migrate the stored Tolgee value for 'k' to plain text)."

run({
  name: 'prefer-hoisted-tag',
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
    // 1. Multiple block tags — INNER contains further tags
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>a</p><p>b</p>" params={{ p: <p /> }} /> }`,
    },
    // 2. Inline tag mid-sentence — wrapper does not span the whole message
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="Has <a>link</a> here" params={{ a: <a /> }} /> }`,
    },
    // 3. Non-pure render-prop — extra text around {chunks}
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hello</p>" params={{ p: (chunks) => <p>extra {chunks}</p> }} /> }`,
    },
    // 4. EL !== W divergence — message tag p, rendered element span
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>X</p>" params={{ p: <span /> }} /> }`,
    },
    // 5. Attributes on the message wrapper tag
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p class='a'>X</p>" params={{ p: <p /> }} /> }`,
    },
    // 6. ICU placeholder in INNER
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hi {name}</p>" params={{ p: <p /> }} /> }`,
    },
    // 7. ns prop present
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>X</p>" params={{ p: <p /> }} ns="admin" /> }`,
    },
    // 8. noWrap prop present
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>X</p>" params={{ p: <p /> }} noWrap /> }`,
    },
    // 9. Spread props
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>X</p>" params={{ p: <p /> }} {...rest} /> }`,
    },
    // 10. More than one param
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>X</p>" params={{ p: <p />, q: <q /> }} /> }`,
    },
    // 11. Spread in params
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>X</p>" params={{ ...rest }} /> }`,
    },
    // 12. Tag-free static <T> — prefer-t-function's domain, never this rule (mutual exclusivity)
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="Hello" /> }`,
    },
    // 13. Module-scope — not a component context
    {
      code: `const x = <T keyName="k" defaultValue="<p>X</p>" params={{ p: <p /> }} />`,
    },
    // 14. Wrapper tag not in the `tags` allowlist
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<aside>X</aside>" params={{ aside: <aside /> }} /> }`,
      options: [{ tags: ['p', 'span'] }],
    },
  ],

  invalid: [
    // 15. Suggestion-by-default — no autofix applied, suggestion offered with migration warning
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hello</p>" params={{ p: <p className="x" /> }} /> }`,
      output: null,
      errors: [
        {
          messageId: 'preferHoistedTag',
          // Only the keys we assert are matched (toMatchObject); the runtime
          // LintSuggestion also carries a `fix`, which we don't reproduce here.
          suggestions: [{ messageId: 'hoistSuggestion', desc: HOIST_DESC }] as never,
        },
      ],
    },
    // 16. Autofix mode — childless element wrapper, props carried verbatim
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hello</p>" params={{ p: <p className="x" /> }} /> }`,
      options: [{ autofix: true }],
      output: `function C() { const { t } = useTranslate(); return <p className="x">{t('k', 'Hello')}</p> }`,
      errors: [{ messageId: 'preferHoistedTag' }],
    },
    // 17. Autofix mode — render-prop pure wrapper
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hello</p>" params={{ p: (chunks) => <p className="x">{chunks}</p> }} /> }`,
      options: [{ autofix: true }],
      output: `function C() { const { t } = useTranslate(); return <p className="x">{t('k', 'Hello')}</p> }`,
      errors: [{ messageId: 'preferHoistedTag' }],
    },
    // 18. Report-only — no t binding in scope, no suggestion/fix
    {
      code: `function C() { return <T keyName="k" defaultValue="<p>Hi</p>" params={{ p: <p /> }} /> }`,
      output: null,
      errors: [{ messageId: 'preferHoistedTagManual' }],
    },
    // 19. Autofix mode — prop (attribute-value) position
    {
      code: `function C() { const { t } = useTranslate(); return <div title={<T keyName="k" defaultValue="<span>Hi</span>" params={{ span: <span /> }} />} /> }`,
      options: [{ autofix: true }],
      output: `function C() { const { t } = useTranslate(); return <div title={<span>{t('k', 'Hi')}</span>} /> }`,
      errors: [{ messageId: 'preferHoistedTag' }],
    },
    // 20. Autofix mode — render-prop with TS-annotated chunk param (mirror of prefer-t-function valid case 29, flagged here)
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>Hello</p>" params={{ p: (chunks: ReactNode) => <p className="x">{chunks}</p> }} /> }`,
      options: [{ autofix: true }],
      output: `function C() { const { t } = useTranslate(); return <p className="x">{t('k', 'Hello')}</p> }`,
      errors: [{ messageId: 'preferHoistedTag' }],
    },
    // 21. Default value contains a single quote — INNER switches to double-quote wrapper
    {
      code: `function C() { const { t } = useTranslate(); return <T keyName="k" defaultValue="<p>You don't</p>" params={{ p: <p /> }} /> }`,
      options: [{ autofix: true }],
      output: `function C() { const { t } = useTranslate(); return <p>{t('k', "You don't")}</p> }`,
      errors: [{ messageId: 'preferHoistedTag' }],
    },
  ],
})
