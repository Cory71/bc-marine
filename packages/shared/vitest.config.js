import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests outside BC so time zone bugs show up
    env: { TZ: 'America/Toronto' },
  },
});
