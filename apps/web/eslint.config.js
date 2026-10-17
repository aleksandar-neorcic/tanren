import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // A page module exports its component *and* its route loader, which the
      // rule reads as "not a component file" and would otherwise flag. Named
      // here rather than silenced per file: `loader` beside the page it feeds
      // is the convention this app uses, so the config should know about it.
      'react-refresh/only-export-components': ['warn', { allowExportNames: ['loader'] }],
    },
  },
])
