import path from 'node:path';

import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(__dirname, '.'),
  '@app': path.resolve(__dirname, 'app'),
  '@components': path.resolve(__dirname, 'components'),
  '@lib': path.resolve(__dirname, 'lib'),
  '@hooks': path.resolve(__dirname, 'hooks'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          env: { TZ: 'UTC' },
          include: ['**/*.test.ts'],
          exclude: ['node_modules', '.next'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'dom',
          environment: 'jsdom',
          env: { TZ: 'UTC' },
          include: ['**/*.test.tsx'],
          exclude: ['node_modules', '.next'],
        },
      },
    ],
  },
});
