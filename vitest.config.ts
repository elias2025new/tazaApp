import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Mock 'server-only' to a no-op in Vitest — it's a Next.js compile-time guard,
      // not a runtime requirement. Tests run in Node, not Next.js's React server context.
      'server-only': resolve(__dirname, './tests/unit/__mocks__/server-only.ts'),
    },
  },
});
