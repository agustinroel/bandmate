import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    environment: 'jsdom',
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});

