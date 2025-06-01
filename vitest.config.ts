/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    environment: 'node',
    sequence: {
      shuffle: false,
    },
    maxConcurrency: 1,
  },
});
