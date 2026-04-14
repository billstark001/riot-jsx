import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import riot from 'rollup-plugin-riot';

const base = process.env.VITE_BASE_URL ?? '/';

export default defineConfig({
  base,
  plugins: [
    // Handle .riot single-file components (rollup-plugin-riot works with Vite)
    riot(),
    // Preact JSX transform + automatic aliasing
    preact(),
  ],
  resolve: {
    alias: {
      // Ensure react APIs resolve to Preact's compat layer if any dep needs them
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
    },
  },
});
