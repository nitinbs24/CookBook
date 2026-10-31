import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    globalSetup: ['./src/global-setup.js'],
    setupFiles: ['./src/setup-file.js'],
    fileParallelism: false, // files share one database
    testTimeout: 15_000,
  },
});
