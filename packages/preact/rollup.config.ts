import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = ['preact', 'preact/hooks', 'preact-render-to-string', '@riot-jsx/base', 'riot'];

export default defineConfig([
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.mjs', format: 'esm', sourcemap: true },
    external,
    plugins: [typescript({ tsconfig: './tsconfig.json', declaration: false, sourceMap: true })],
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'esm' },
    external,
    plugins: [dts({ tsconfig: './tsconfig.json' })],
  },
]);
