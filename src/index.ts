import enforcePlaceholders from './rules/enforce-placeholders.js'
import noDynamicKey from './rules/no-dynamic-key.js'
import preferStringArguments from './rules/prefer-string-arguments.js'
import requireKey from './rules/require-key.js'

const plugin = {
  meta: {
    name: '@myeasyfarm/eslint-plugin-tolgee',
    version: '0.1.0',
  },
  rules: {
    'require-key': requireKey,
    'prefer-string-arguments': preferStringArguments,
    'no-dynamic-key': noDynamicKey,
    'enforce-placeholders': enforcePlaceholders,
  },
  configs: {} as Record<string, unknown>,
}

plugin.configs.recommended = {
  plugins: {
    tolgee: plugin,
  },
  rules: {
    'tolgee/require-key': 'error',
    'tolgee/prefer-string-arguments': 'error',
    'tolgee/no-dynamic-key': 'error',
    'tolgee/enforce-placeholders': 'error',
  },
}

export default plugin
export { plugin }
