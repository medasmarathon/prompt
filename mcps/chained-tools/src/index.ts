/**
 * Main MCP server for chained-tools with dynamic tool registration.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MCPClientManager } from "./mcp-client.js";
import {
  initializeToolRegistry,
  buildToolsList,
  ToolRegistryState,
} from "./tool-registry.js";
import {
  executeChainedTool,
  executePassthroughTool,
} from "./tool-executor.js";

// Global state
let registryState: ToolRegistryState | null = null;

/**
 * Initialize the tool registry by discovering all tools from configured servers.
 */
async function initializeTools(): Promise<void> {
  if (registryState) return;

  const clientManager = new MCPClientManager();
  registryState = await initializeToolRegistry(clientManager);
}

/**
 * Main server entry point.
 */
async function main(): Promise<void> {
  // Initialize tools before starting server
  await initializeTools();

  if (!registryState) {
    throw new Error("Failed to initialize tool registry");
  }

  // Create server
  const server = new Server(
    {
      name: "chained-tools",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request - TRUE DYNAMIC TOOLS!
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: buildToolsList(
        registryState!.chainedTools,
        registryState!.passthroughTools
      ),
    };
  });

  // Handle call tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args || {}) as Record<string, unknown>;

    // Check if it's a chained tool
    if (registryState!.chainedTools.has(name)) {
      const chainedInfo = registryState!.chainedTools.get(name)!;
      const result = await executeChainedTool(
        chainedInfo,
        toolArgs,
        registryState!.clientManager
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Check if it's a passthrough tool
    if (registryState!.passthroughTools.has(name)) {
      const toolInfo = registryState!.passthroughTools.get(name)!;
      const result = await executePassthroughTool(
        toolInfo,
        toolArgs,
        registryState!.clientManager
      );
      return {
        content: [
          {
            type: "text",
            text:
              typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Chained Tools MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
