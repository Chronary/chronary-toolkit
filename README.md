# @chronary/toolkit

AI-agent framework adapters for [Chronary](https://chronary.ai) — 65 calendar tools usable directly by Vercel AI SDK, LangChain, Mastra, OpenAI function calling, and MCP clients.

## Installation

```bash
npm install @chronary/toolkit @chronary/sdk
# pnpm add @chronary/toolkit @chronary/sdk
# yarn add @chronary/toolkit @chronary/sdk
```

Each adapter's runtime peer dependency (e.g. `ai`, `@langchain/core`, `@modelcontextprotocol/sdk`) must be installed separately — see each adapter section below.

## Quickstart

### Vercel AI SDK

```ts
import { generateText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chronaryTools } from '@chronary/toolkit/ai-sdk';

const tools = chronaryTools({
  apiKey: process.env.CHRONARY_API_KEY!,
});

const result = await generateText({
  model: openai('gpt-4o'),
  tools,
  stopWhen: stepCountIs(5), // AI SDK 4: maxSteps: 5
  prompt: 'Schedule a 30-minute sync with Alex next Tuesday at 10am.',
});
```

Works with AI SDK 4, 5 and 6: each tool carries its Zod input schema as `inputSchema` (AI SDK 5 and 6) and as `parameters` (AI SDK 4).

### LangChain

```ts
import { ChatOpenAI } from '@langchain/openai';
import { ChronaryToolkit } from '@chronary/toolkit/langchain';

const tools = new ChronaryToolkit({
  apiKey: process.env.CHRONARY_API_KEY!,
}).getTools();

const llm = new ChatOpenAI({ model: 'gpt-4o' }).bindTools(tools);
```

### OpenAI function calling

```ts
import OpenAI from 'openai';
import { ChronaryToolkit } from '@chronary/toolkit/openai';

const tools = new ChronaryToolkit({
  apiKey: process.env.CHRONARY_API_KEY!,
}).getTools();

const client = new OpenAI();
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'When is my next calendar event?' }],
  tools,
});
```

### Mastra

```ts
import { Agent } from '@mastra/core/agent';
import { ChronaryToolkit } from '@chronary/toolkit/mastra';

const tools = new ChronaryToolkit({
  apiKey: process.env.CHRONARY_API_KEY!,
}).getTools();

const agent = new Agent({ name: 'scheduler', tools });
```

### MCP (Model Context Protocol)

```ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { ChronaryToolkit } from '@chronary/toolkit/mcp';

const tools = new ChronaryToolkit({
  apiKey: process.env.CHRONARY_API_KEY!,
}).getTools();
```

If you want a ready-to-run stdio MCP server instead of wiring tools into your own server, use [`chronary-mcp`](https://github.com/Chronary/chronary-mcp) — it wraps this toolkit for one-line MCP client setup.

## Layered architecture

```
your agent code
       ↓
@chronary/toolkit/<framework>   ← this package — adapts tools per framework
       ↓
@chronary/sdk                   ← raw HTTP client
       ↓
api.chronary.ai (REST)
```

Every adapter produces the same 65 calendar tools in the format the target framework expects. Tool definitions live in [`src/definitions.ts`](./src/definitions.ts); Zod schemas are in [`src/schemas.ts`](./src/schemas.ts).

## Documentation

- [docs.chronary.ai](https://docs.chronary.ai)
- [API reference](https://docs.chronary.ai/api-reference/overview)

## License

Apache-2.0. See [LICENSE](./LICENSE).
