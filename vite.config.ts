import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

// Get git commit SHA at build time
let commitSha = 'dev'
try {
  commitSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // Fallback: Cloudflare Pages sets CF_PAGES_COMMIT_SHA
  if (process.env.CF_PAGES_COMMIT_SHA) {
    commitSha = process.env.CF_PAGES_COMMIT_SHA.substring(0, 7)
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        dialog: path.resolve(__dirname, 'dialog.html'),
      },
    },
  },
})
