import { renameSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  external: ['eslint'],
  hooks: {
    'build:done': () => {
      const distDir = join(process.cwd(), 'dist')
      for (const file of readdirSync(distDir)) {
        const match = file.match(/^index-[A-Za-z0-9_-]+\.d\.ts(\.map)?$/)
        if (match) {
          const target = match[1] ? 'index.d.ts.map' : 'index.d.ts'
          renameSync(join(distDir, file), join(distDir, target))
        }
      }
    },
  },
})
