import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Set base path: GitHub Pages deploys under /Fixars/, whereas Railway, Vercel, and local dev use /
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.GH_PAGES === 'true'

export default defineConfig({
  base: isGitHubPages ? '/Fixars/' : '/',
  plugins: [react(), tailwindcss()],
  // Client-only unit tests; server/landing-page suites run via node:test
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          radix: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
})
