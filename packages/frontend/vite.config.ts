import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      '@arbimerge/shared': path.resolve(__dirname, '../shared/src/index.ts')
    },
    preserveSymlinks: true
  },
  server: {
    fs: {
      allow: [
        '..', // Allow access to the monorepo packages/ folder
        '../../node_modules' // Allow access to root node_modules
      ]
    }
  },
  optimizeDeps: {
    exclude: ['@arbimerge/shared']
  }
})
