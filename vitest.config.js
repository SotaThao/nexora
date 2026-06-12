import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['tests/unit/**/*.test.{js,jsx,ts,tsx}', 'src/data/repositories/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  },
});
