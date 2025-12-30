import { defineConfig, configDefaults } from 'vitest/config';

const config = defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcovonly'],
      enabled: true,
      exclude: configDefaults.coverage.exclude ?? [],
    },

    /**
     * disabling {@link https://vitest.dev/config/isolate.html} to improve performance and enable worker
     * fixtures ({@link https://vitest.dev/guide/test-context.html#per-scope-context-3-2-0})
     */
    isolate: false,
  },
});

/* eslint-disable import/no-default-export -- the config must be default-exported */
export default config;
/* eslint-enable import/no-default-export */
