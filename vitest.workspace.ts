import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'frontend',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'jsdom',
    },
  },
  {
    test: {
      name: 'backend',
      include: ['server/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
]);
