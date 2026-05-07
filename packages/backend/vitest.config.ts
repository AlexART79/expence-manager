import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    env: {
      NODE_ENV: 'test',
      // Override Vite's injected BASE_URL='/' which fails the URL validation in env.ts
      BASE_URL: 'http://localhost:3000',
    },
  },
});
