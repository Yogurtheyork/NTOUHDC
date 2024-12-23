import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'routes/rentSpaceAutomation.mjs',
  output: {
    format: 'esm',
    dir: 'out',
  },
  external: ['chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js'],
  plugins: [
    nodeResolve({
      browser: true,
      resolveOnly: ['puppeteer-core'],
    }),
  ],
};