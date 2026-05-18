import { Chronary } from '@chronary/sdk';
import type { ToolDefinition, ToolName, ChronaryToolkitConfig } from './types';
import { TOOL_DEFINITIONS } from './definitions';

function resolveClient(config: ChronaryToolkitConfig): Chronary {
  if ('client' in config && config.client) return config.client;
  const { tools: _tools, ...sdkConfig } = config as {
    apiKey?: string;
    baseUrl?: string;
    tools?: ToolName[];
    extraHeaders?: Record<string, string>;
  };
  return new Chronary(sdkConfig);
}

export abstract class BaseToolkit<T> {
  protected readonly client: Chronary;
  protected readonly definitions: ToolDefinition[];

  constructor(config: ChronaryToolkitConfig) {
    this.client = resolveClient(config);
    this.definitions = config.tools
      ? TOOL_DEFINITIONS.filter((d) => (config.tools as ToolName[]).includes(d.name))
      : [...TOOL_DEFINITIONS];
  }

  /** Convert a framework-agnostic ToolDefinition into the adapter's native format */
  protected abstract buildTool(def: ToolDefinition): T;

  abstract getTools(): T[] | Record<string, T>;
}

export abstract class ListToolkit<T> extends BaseToolkit<T> {
  getTools(): T[] {
    return this.definitions.map((def) => this.buildTool(def));
  }
}

export abstract class MapToolkit<T> extends BaseToolkit<T> {
  getTools(): Record<string, T> {
    const map: Record<string, T> = {};
    for (const def of this.definitions) {
      map[def.name] = this.buildTool(def);
    }
    return map;
  }
}
