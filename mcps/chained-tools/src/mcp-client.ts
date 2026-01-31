/**
 * MCP client for communicating with MCP servers.
 */

import { spawn, ChildProcess } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ServerConfig, ToolInfo, ToolCallResult, ToolInputSchema } from "./types.js";

/**
 * Manages connections to multiple MCP servers.
 */
export class MCPClientManager {
  private servers: Map<string, ServerConfig> = new Map();
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private toolsCache: Map<string, ToolInfo[]> = new Map();

  /**
   * Register a server configuration.
   */
  registerServer(name: string, config: ServerConfig): void {
    this.servers.set(name, config);
  }

  /**
   * Connect to a server and return the client.
   */
  async getClient(serverName: string): Promise<Client> {
    // Return cached client if available
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    const config = this.servers.get(serverName);
    if (!config) {
      throw new Error(`Unknown server: ${serverName}`);
    }

    // Build env object with only string values (filter out undefined)
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    // Add config env vars
    if (config.env) {
      for (const [key, value] of Object.entries(config.env)) {
        env[key] = value;
      }
    }

    // Create transport
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env,
    });

    // Create client
    const client = new Client(
      {
        name: "chained-tools",
        version: "0.1.0",
      },
      {
        capabilities: {},
      }
    );

    // Connect
    await client.connect(transport);

    // Cache
    this.clients.set(serverName, client);
    this.transports.set(serverName, transport);

    return client;
  }

  /**
   * List all tools from a server.
   */
  async listTools(serverName: string): Promise<ToolInfo[]> {
    // Check cache first
    if (this.toolsCache.has(serverName)) {
      return this.toolsCache.get(serverName)!;
    }

    const client = await this.getClient(serverName);
    const result = await client.listTools();

    const tools: ToolInfo[] = result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      inputSchema: tool.inputSchema as ToolInputSchema,
      serverName,
    }));

    this.toolsCache.set(serverName, tools);
    return tools;
  }

  /**
   * Call a tool on a server.
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> {
    try {
      const client = await this.getClient(serverName);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      // Extract content from result
      const content = result.content as Array<{ type: string; text?: string; data?: string }> | undefined;
      if (content && Array.isArray(content) && content.length > 0) {
        const contents = content.map((item) => {
          if ("text" in item && item.text) return item.text;
          if ("data" in item && item.data) return item.data;
          return String(item);
        });

        return {
          success: true,
          result: contents.length === 1 ? contents[0] : contents,
        };
      }

      return { success: true, result: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Discover tools from all registered servers.
   */
  async discoverAllTools(): Promise<Map<string, ToolInfo[]>> {
    const results = new Map<string, ToolInfo[]>();

    const discoveries = Array.from(this.servers.keys()).map(async (name) => {
      try {
        const tools = await this.listTools(name);
        return { name, tools };
      } catch (error) {
        console.error(`Warning: Failed to discover tools from ${name}:`, error);
        return { name, tools: [] };
      }
    });

    const serverResults = await Promise.all(discoveries);

    for (const { name, tools } of serverResults) {
      results.set(name, tools);
    }

    return results;
  }

  /**
   * Clear the tools cache.
   */
  clearCache(): void {
    this.toolsCache.clear();
  }

  /**
   * Close all client connections.
   */
  async closeAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Error closing client ${name}:`, error);
      }
    }
    this.clients.clear();
    this.transports.clear();
  }
}