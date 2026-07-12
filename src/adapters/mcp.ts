import { z, type ZodRawShape } from 'zod';
import { ListToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig, ToolResult, ToolAnnotations } from '../types';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: ToolAnnotations;
}

export interface McpToolRegistrationConfig {
  title?: string;
  description?: string;
  inputSchema?: ZodRawShape;
  annotations?: ToolAnnotations;
}

export type McpToolHandlerResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

export interface McpPromptRegistrationConfig {
  title?: string;
  description?: string;
  argsSchema?: ZodRawShape;
}

export type McpPromptHandlerResult = {
  messages: Array<{ role: 'user'; content: { type: 'text'; text: string } }>;
};

export interface McpResourceRegistrationConfig {
  title?: string;
  description?: string;
  mimeType?: string;
}

export type McpResourceHandlerResult = {
  contents: Array<{ uri: string; mimeType: string; text: string }>;
};

/**
 * Minimal shape of the MCP SDK's `McpServer` that the toolkit depends on.
 * Matches `registerTool(name, config, handler)` from `@modelcontextprotocol/sdk` >= 1.10.
 * `registerPrompt` / `registerResource` are optional so tool-only callers (and
 * the test mocks) don't have to implement them.
 */
export interface McpServerLike {
  registerTool(
    name: string,
    config: McpToolRegistrationConfig,
    handler: (params: Record<string, unknown>) => Promise<McpToolHandlerResult>,
  ): unknown;
  // Handler types are intentionally permissive: the toolkit does not depend on
  // the MCP SDK, and the real `McpServer.registerPrompt/registerResource` use
  // generic callbacks whose exact shape (parsed-arg inference + an `extra`
  // param + sync-or-Promise return) we don't want to reproduce here. Accepting
  // `(...args: any[])` lets a real `McpServer` satisfy this interface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerPrompt?(
    name: string,
    config: McpPromptRegistrationConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (...args: any[]) => McpPromptHandlerResult | Promise<McpPromptHandlerResult>,
  ): unknown;
  registerResource?(
    name: string,
    uri: string,
    config: McpResourceRegistrationConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (...args: any[]) => McpResourceHandlerResult | Promise<McpResourceHandlerResult>,
  ): unknown;
}

// Overview the model can read for orientation. Kept identical to the hosted
// server's `chronary://about` resource so the two MCP surfaces are in parity.
const ABOUT_MARKDOWN = `# Chronary

Calendar-as-a-service for AI agents. Give an agent its own calendars and
events, coordinate availability across agents, run multi-party scheduling
proposals, place auto-expiring holds, manage availability rules, sync external
iCal feeds, and receive webhooks.

## Getting started
1. \`create_agent\` — register an agent (skip if you already have one).
2. \`create_calendar\` — give the agent a calendar.
3. \`create_event\` / \`get_availability\` / \`find_meeting_time\` — schedule and coordinate.

## Keys & plans
Org keys (\`chr_sk_\`) can use every tool; agent-scoped keys (\`chr_ak_\`) are
limited to their own agent and cannot use org-only tools such as
\`create_agent\` or \`find_meeting_time\`. Temporal holds, cross-agent
availability, and scheduling proposals require a Pro plan.`;

/**
 * MCP v1.x adapter.
 *
 * Use `registerAll(server)` to register tools directly on an McpServer instance,
 * or `getTools()` to get tool metadata for custom registration.
 *
 * @example
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/mcp';
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
 *
 * const server = new McpServer({ name: 'chronary', version: '1.0.0' });
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * toolkit.registerAll(server);
 * ```
 */
export class ChronaryToolkit extends ListToolkit<McpToolDefinition> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): McpToolDefinition {
    return {
      name: def.name,
      description: def.description,
      inputSchema: z.toJSONSchema(def.schema) as Record<string, unknown>,
      annotations: { ...def.annotations },
    };
  }

  /**
   * Register all tools directly on an McpServer instance.
   * Uses `server.registerTool()` (MCP SDK v1.10+) so annotations reach the client.
   */
  registerAll(server: McpServerLike) {
    const client = this.client;
    for (const def of this.definitions) {
      server.registerTool(
        def.name,
        {
          description: def.description,
          inputSchema: def.schema.shape,
          annotations: { ...def.annotations },
        },
        async (params: Record<string, unknown>) => {
          const result: ToolResult = await def.execute(client, params);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result.result) }],
            isError: result.isError,
          };
        },
      );
    }
  }

  /**
   * Register the reusable prompt templates (MCP `prompts` capability) on an
   * McpServer. Mirrors the hosted server's four prompts so stdio and hosted
   * expose the same `prompts/list`. No-op if the server can't register prompts.
   */
  registerPrompts(server: McpServerLike): void {
    if (!server.registerPrompt) return;

    server.registerPrompt(
      'schedule_event',
      {
        title: 'Schedule an event',
        description: "Create a calendar event on an agent's calendar at a specific time.",
        argsSchema: {
          calendar_id: z.string().describe('Target calendar ID (cal_...). Run list_calendars first if unknown.'),
          title: z.string().describe('Event title'),
          start_time: z.string().describe('Start time, ISO 8601 (e.g. 2026-07-10T15:00:00Z)'),
          end_time: z.string().describe('End time, ISO 8601'),
        },
      },
      ({ calendar_id, title, start_time, end_time }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create an event on calendar ${calendar_id} titled "${title}" from ${start_time} to ${end_time}. Call the create_event tool with those arguments (calendar_id, title, start_time, end_time). If the calendar ID is unknown, call list_calendars first. Report the created event ID when done.`,
            },
          },
        ],
      }),
    );

    server.registerPrompt(
      'find_meeting_time',
      {
        title: 'Find a meeting time',
        description: 'Find a slot that works across several agents, then optionally book it.',
        argsSchema: {
          agent_ids: z.string().describe('Comma-separated agent IDs to coordinate (agt_...).'),
          duration: z.string().describe('Meeting length, e.g. "30m" or "1h".'),
          window: z.string().optional().describe('Optional ISO 8601 range to search, e.g. "2026-07-10T09:00:00Z/2026-07-10T18:00:00Z".'),
        },
      },
      ({ agent_ids, duration, window }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find a ${duration} slot that works for all of these agents: ${agent_ids}${window ? ` within ${window}` : ''}. Call the find_meeting_time tool (agents, duration, and start/end if a window is given). Present the top few candidate slots and ask which to book before calling create_event. (find_meeting_time requires a Pro plan.)`,
            },
          },
        ],
      }),
    );

    server.registerPrompt(
      'daily_agenda',
      {
        title: "Summarize an agent's day",
        description: "Get an agent's current status and upcoming schedule at a glance.",
        argsSchema: {
          agent_id: z.string().describe('Agent whose day to summarize (agt_...).'),
          date: z.string().optional().describe('Optional ISO 8601 date to focus on (defaults to today).'),
        },
      },
      ({ agent_id, date }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Summarize agent ${agent_id}'s schedule${date ? ` for ${date}` : ' for today'}. Use list_calendars to find the agent's calendar(s), then get_calendar_context for the current/next/upcoming events and status. Present a concise agenda.`,
            },
          },
        ],
      }),
    );

    server.registerPrompt(
      'new_scheduling_proposal',
      {
        title: 'Propose a multi-party meeting',
        description: 'Create a scheduling proposal offering several time slots to participants.',
        argsSchema: {
          title: z.string().describe('Proposal / meeting title'),
          organizer_agent_id: z.string().describe('Organizer agent ID (agt_...).'),
          participant_agent_ids: z.string().describe('Comma-separated participant agent IDs (agt_...).'),
        },
      },
      ({ title, organizer_agent_id, participant_agent_ids }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a scheduling proposal "${title}" organized by ${organizer_agent_id} for participants ${participant_agent_ids}. First use get_availability / find_meeting_time to pick 2-3 candidate slots, then call create_proposal with those slots. Report the proposal ID. (Scheduling proposals require a Pro plan and an org-level key.)`,
            },
          },
        ],
      }),
    );
  }

  /**
   * Register the static `chronary://about` resource (MCP `resources` capability)
   * so stdio and hosted expose the same `resources/list`. No-op if the server
   * can't register resources.
   */
  registerResources(server: McpServerLike): void {
    if (!server.registerResource) return;

    server.registerResource(
      'about',
      'chronary://about',
      {
        title: 'About Chronary',
        description: 'What Chronary is and how to use its MCP tools.',
        mimeType: 'text/markdown',
      },
      () => ({
        contents: [{ uri: 'chronary://about', mimeType: 'text/markdown', text: ABOUT_MARKDOWN }],
      }),
    );
  }
}
