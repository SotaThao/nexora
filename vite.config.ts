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
        assetFileNames: (assetInfo) =>
          (assetInfo.names ?? [assetInfo.name]).some((name) =>
            name?.endsWith('pdf.worker.min.mjs'),
          )
            ? 'assets/[name]-[hash].js'
            : 'assets/[name]-[hash][extname]',
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
