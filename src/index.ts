import preferStringArguments from './rules/prefer-string-arguments.js'
import requireTolgeeKey from './rules/require-tolgee-key.js'

const plugin = {
  meta: {
    name: '@myeasyfarm/eslint-plugin-tolgee',
    version: '0.1.0',
  },
  rules: {
    'require-tolgee-key': requireTolgeeKey,
    'prefer-string-arguments': preferStringArguments,
  },
  configs: {} as Record<string, unknown>,
}

plugin.configs.recommended = {
  plugins: {
    tolgee: plugin,
  },
  rules: {
    'tolgee/require-tolgee-key': 'error',
    'tolgee/prefer-string-arguments': 'error',
  },
}

export default plugin
export { plugin }
