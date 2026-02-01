import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/*/vitest.config.ts',
  'packages/*/vitest.config.ts',
  'services/*/vitest.config.ts',
  'modules/*/vitest.config.ts',
  {
    test: {
      include: ['tests/**/*.test.ts'],
      name: 'integration',
      environment: 'node',
    },
  },
]);
