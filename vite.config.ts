import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Mirrors the "@/*" -> "src/*" path in tsconfig.json. Without it tsc resolves the
      // alias but rollup does not, so an "@/..." import typechecks and then fails the build.
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL('./src/', import.meta.url)),
      },
      {
        find: /^pdfjs-dist$/,
        replacement: fileURLToPath(
          new URL('./node_modules/pdfjs-dist/legacy/build/pdf.mjs', import.meta.url),
        ),
      },
    ],
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react-loading-skeleton'],
  },
  envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    // Keep the watcher inside this app. Cursor's workspace is the parent Nexora folder
    // (FE + backend); without this, chokidar can pick up backend/docs noise and the
    // Vite transform cache grows until Node OOM (~4GB, "heap out of memory").
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/coverage/**',
        '**/openspec/**',
        '**/docs/**',
        '**/.cursor/**',
        '**/.vite/**',
      ],
    },
    fs: {
      strict: true,
      allow: ['.'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
