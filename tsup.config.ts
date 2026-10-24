import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: 'src/index.ts',
    register: 'src/register.ts',
    react: 'src/react.ts',
  },
  external: ['@ilokesto/form', '@lit/react', 'lit', 'react'],
  format: ['esm'],
  outDir: 'dist',
  sourcemap: true,
  splitting: true,
  target: 'es2022',
  treeshake: true,
});
