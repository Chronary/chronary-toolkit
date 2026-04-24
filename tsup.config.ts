import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ai-sdk': 'src/adapters/ai-sdk.ts',
    mcp: 'src/adapters/mcp.ts',
    openai: 'src/adapters/openai.ts',
    langchain: 'src/adapters/langchain.ts',
    mastra: 'src/adapters/mastra.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  external: [
    'ai',
    '@modelcontextprotocol/sdk',
    'openai',
    '@langchain/core',
    '@mastra/core',
  ],
});
