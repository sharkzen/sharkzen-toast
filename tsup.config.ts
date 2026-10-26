import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', react: 'src/react.tsx' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react'],
  // esbuild drops module-level directives, so re-add "use client" to the
  // React entry after the build (needed by the Next.js app router).
  async onSuccess() {
    for (const file of ['dist/react.js', 'dist/react.cjs']) {
      const code = readFileSync(file, 'utf8')
      if (!code.startsWith('"use client"')) writeFileSync(file, `"use client";\n${code}`)
    }
  },
})
