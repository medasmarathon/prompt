/**
 * Main MCP server for chained-tools with dynamic tool registration.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { loadAllConfigs, validateChainsConfig } from "./config.js";
import { MCPClientManager } from "./mcp-client.js";
import type {
  ToolInfo,
  ChainedToolInfo,
  ParsedChainTarget,
  ChainConfig,
  ToolInputSchema,
} from "./types.js";

// Global state
const clientManager = new MCPClientManager();
let allTools: Map<string, ToolInfo[]> = new Map();
let chainedTools: Map<string, ChainedToolInfo> = new Map();
let passthroughTools: Map<string, ToolInfo> = new Map();
let initialized = false;

/**
 * Parse a chain target key to extract server name and optional tool name.
 * Format: "serverName" or "serverName/toolName"
 */
function parseChainTarget(chainKey: string): ParsedChainTarget {
  const slashIndex = chainKey.indexOf("/");
  if (slashIndex === -1) {
    return { serverName: chainKey };
  }
  return {
    serverName: chainKey.substring(0, slashIndex),
    toolName: chainKey.substring(slashIndex + 1),
  };
}

/**
 * Get a unique name for a tool, prefixing with server name if needed.
 */
function getToolUniqueName(
  tool: ToolInfo,
  allToolsMap: Map<string, ToolInfo[]>
): string {
  const toolName = tool.name;

  // Count how many servers have a tool with this name
  let count = 0;
  for (const tools of allToolsMap.values()) {
    if (tools.some((t) => t.name === toolName)) {
      count++;
    }
  }

  if (count > 1) {
    // Name conflict, prefix with server name
    return `${tool.serverName}_${toolName}`;
  }
  return toolName;
}

/**
 * Build the exposed name for a chained tool.
 * Format: chained_<toolA_name>_with_<toolB_name>
 */
function buildChainedToolName(
  toolA: ToolInfo,
  toolB: ToolInfo,
  allToolsMap: Map<string, ToolInfo[]>
): string {
  const aName = getToolUniqueName(toolA, allToolsMap);
  const bName = getToolUniqueName(toolB, allToolsMap);
  return `chained_${aName}_with_${bName}`;
}

/**
 * Build the combined description for a chained tool.
 * Supports template placeholders:
 * - {{previous_description}}: The description of tool A (or the previous chain description)
 * - {{current_description}}: The description of tool B (the current tool being chained)
 * 
 * @param toolADescription - Description of tool A (or previous chain)
 * @param toolBDescription - Description of tool B (current tool)
 * @param customDescription - Optional custom description template
 */
function buildChainedDescription(
  toolADescription: string,
  toolBDescription: string,
  customDescription?: string
): string {
  const defaultDescription = `${toolADescription}\n\nFINALLY\n${toolBDescription}`;

  if (customDescription) {
    // Replace template placeholders
    return customDescription
      .replace(/\{\{previous_description\}\}/g, toolADescription)
      .replace(/\{\{current_description\}\}/g, toolBDescription);
  }

  return defaultDescription;
}

/**
 * Build the combined input schema for a chained tool.
 * Schema structure:
 * {
 *   "<toolA.name>": { <toolA params> },
 *   "<toolB.name>": { <toolB params> }
 * }
 */
function buildChainedSchema(
  toolA: ToolInfo,
  toolB: ToolInfo
): ToolInputSchema {
  return {
    type: "object",
    properties: {
      [toolA.name]: {
        type: "object",
        description: `Parameters for ${toolA.name}`,
        properties: (toolA.inputSchema.properties || {}) as Record<string, object>,
        required: toolA.inputSchema.required || [],
      },
      [toolB.name]: {
        type: "object",
        description: `Parameters for ${toolB.name}`,
        properties: (toolB.inputSchema.properties || {}) as Record<string, object>,
        required: toolB.inputSchema.required || [],
      },
    },
    required: [toolA.name, toolB.name],
  };
}

/**
 * Find a tool by name across all servers.
 * Supports multiple formats:
 * - "toolName" - finds first tool with that name
 * - "serverName/toolName" - finds specific tool from specific server
 * - "serverName_toolName" - finds tool with underscore-prefixed name
 */
function findToolByName(
  toolNameOrPath: string,
  serverTools: Map<string, ToolInfo[]>
): ToolInfo | undefined {
  // Check if it's in "serverName/toolName" format
  const slashIndex = toolNameOrPath.indexOf("/");
  if (slashIndex !== -1) {
    const serverName = toolNameOrPath.substring(0, slashIndex);
    const toolName = toolNameOrPath.substring(slashIndex + 1);
    return findToolByServerAndName(serverName, toolName, serverTools);
  }

  // Search across all servers
  for (const [serverName, tools] of serverTools) {
    for (const tool of tools) {
      // Direct name match
      if (tool.name === toolNameOrPath) {
        return tool;
      }
      // Check if toolNameOrPath is server_toolname format
      if (toolNameOrPath === `${serverName}_${tool.name}`) {
        return tool;
      }
    }
  }
  return undefined;
}

/**
 * Find a specific tool from a specific server.
 */
function findToolByServerAndName(
  serverName: string,
  toolName: string,
  serverTools: Map<string, ToolInfo[]>
): ToolInfo | undefined {
  const tools = serverTools.get(serverName);
  if (!tools) return undefined;
  return tools.find((t) => t.name === toolName);
}

/**
 * Initialize and discover all tools from configured servers.
 */
async function initializeTools(): Promise<void> {
  if (initialized) return;

  try {
    // Load configurations
    const { serversConfig, chainsConfig } = loadAllConfigs();

    // Validate chains reference valid servers
    const warnings = validateChainsConfig(serversConfig, chainsConfig);
    for (const warning of warnings) {
      console.error(`Warning: ${warning}`);
    }

    // Register all servers with client manager
    for (const [name, config] of Object.entries(serversConfig.mcpServers)) {
      clientManager.registerServer(name, config);
    }

    // Discover all tools from all servers
    allTools = await clientManager.discoverAllTools();

    // Build set of tools that are part of chains (as "A" tools - trigger tools)
    // Store the full path (serverName/toolName or just toolName) for tracking
    const chainedATools = new Set<string>();
    for (const chainConfig of Object.values(chainsConfig.chains)) {
      for (const toolPath of chainConfig.afterTools) {
        chainedATools.add(toolPath);
        // Also add just the tool name for passthrough exclusion (without server prefix)
        const parsed = parseChainTarget(toolPath);
        if (parsed.toolName) {
          chainedATools.add(parsed.toolName);
        }
      }
    }

    // Track specific B tools that are used in chains (server/tool format)
    // This tracks which specific tools from chain servers should be excluded from passthrough
    const chainedBTools = new Set<string>(); // Format: "serverName/toolName"

    // Track servers that have ALL their tools used in chains (when no specific tool is specified)
    const fullChainServers = new Set<string>();

    // Parse all chain targets to understand which B tools are involved
    for (const chainKey of Object.keys(chainsConfig.chains)) {
      const target = parseChainTarget(chainKey);
      if (target.toolName) {
        // Specific tool: "serverName/toolName"
        chainedBTools.add(`${target.serverName}/${target.toolName}`);
      } else {
        // Full server: all tools from this server are chained
        fullChainServers.add(target.serverName);
      }
    }

    // Track servers marked as forChained - their tools should not be passthrough
    const forChainedServers = new Set<string>();
    for (const [serverName, config] of Object.entries(serversConfig.mcpServers)) {
      if (config.forChained === true) {
        forChainedServers.add(serverName);
      }
    }

    // Process chains - create chained tool for each (A tool, B tool) pair
    for (const [chainKey, chainConfig] of Object.entries(chainsConfig.chains)) {
      const target = parseChainTarget(chainKey);

      const serverTools = allTools.get(target.serverName);
      if (!serverTools) {
        console.error(`Warning: Chain server not found: ${target.serverName}`);
        continue;
      }

      // Determine which B tools to use
      let bTools: ToolInfo[];
      if (target.toolName) {
        // Specific tool specified
        const specificTool = findToolByServerAndName(target.serverName, target.toolName, allTools);
        if (!specificTool) {
          console.error(`Warning: Chain tool not found: ${target.serverName}/${target.toolName}`);
          continue;
        }
        bTools = [specificTool];
      } else {
        // Use all tools from the server
        bTools = serverTools;
      }

      // For each trigger tool in afterTools
      for (const triggerToolPath of chainConfig.afterTools) {
        // Find the trigger tool (A tool) - now supports serverName/toolName format
        const toolA = findToolByName(triggerToolPath, allTools);
        if (!toolA) {
          console.error(`Warning: Trigger tool not found: ${triggerToolPath}`);
          continue;
        }

        // For each B tool, create a chained tool
        for (const toolB of bTools) {
          // Create chained tool pairing A -> B
          const exposedName = buildChainedToolName(toolA, toolB, allTools);

          const chainedInfo: ChainedToolInfo = {
            exposedName,
            toolA,
            toolB,
            description: buildChainedDescription(
              toolA.description,
              toolB.description,
              chainConfig.description
            ),
            inputSchema: buildChainedSchema(toolA, toolB),
          };

          chainedTools.set(exposedName, chainedInfo);
        }
      }
    }

    // Process passthrough tools
    // A tool is passthrough if it's NOT:
    // 1. Listed in any afterTools array (A tools) - by name or full path
    // 2. A specific B tool mentioned in chains (serverName/toolName format)
    // 3. From a server that has all its tools chained (serverName format without specific tool)
    // 4. From a server marked with forChained: true
    for (const [serverName, tools] of allTools) {
      for (const tool of tools) {
        // Check both the tool name and the full path (serverName/toolName)
        const isATool = chainedATools.has(tool.name) || chainedATools.has(`${serverName}/${tool.name}`);
        const isSpecificBTool = chainedBTools.has(`${serverName}/${tool.name}`);
        const isFromFullChainServer = fullChainServers.has(serverName);
        const isFromForChainedServer = forChainedServers.has(serverName);

        if (!isATool && !isSpecificBTool && !isFromFullChainServer && !isFromForChainedServer) {
          const exposedName = getToolUniqueName(tool, allTools);
          passthroughTools.set(exposedName, tool);
        }
      }
    }

    initialized = true;

    console.error(
      `Initialized ${chainedTools.size} chained tools and ${passthroughTools.size} passthrough tools`
    );
  } catch (error) {
    console.error("Error initializing tools:", error);
    throw error;
  }
}

/**
 * Execute a chained tool call.
 * Returns: [<toolA result>, <toolB result>]
 */
async function callChainedTool(
  chainedInfo: ChainedToolInfo,
  args: Record<string, unknown>
): Promise<unknown[]> {
  const { toolA, toolB } = chainedInfo;

  // Extract arguments for each tool
  const argsA = (args[toolA.name] as Record<string, unknown>) || {};
  const argsB = (args[toolB.name] as Record<string, unknown>) || {};

  // Call tool A first
  const resultA = await clientManager.callTool(
    toolA.serverName,
    toolA.name,
    argsA
  );

  if (!resultA.success) {
    return [{ error: resultA.error }, null];
  }

  // Call tool B
  const resultB = await clientManager.callTool(
    toolB.serverName,
    toolB.name,
    argsB
  );

  if (!resultB.success) {
    return [resultA.result, { error: resultB.error }];
  }

  return [resultA.result, resultB.result];
}

/**
 * Execute a passthrough tool call.
 */
async function callPassthroughTool(
  toolInfo: ToolInfo,
  args: Record<string, unknown>
): Promise<unknown> {
  const result = await clientManager.callTool(
    toolInfo.serverName,
    toolInfo.name,
    args
  );

  if (!result.success) {
    return { error: result.error };
  }

  return result.result;
}

/**
 * Build the list of all exposed tools.
 */
function buildToolsList(): Tool[] {
  const tools: Tool[] = [];

  // Add chained tools
  for (const [name, info] of chainedTools) {
    tools.push({
      name,
      description: info.description,
      inputSchema: info.inputSchema,
    });
  }

  // Add passthrough tools
  for (const [name, info] of passthroughTools) {
    tools.push({
      name,
      description: info.description,
      inputSchema: info.inputSchema,
    });
  }

  return tools;
}

/**
 * Main server entry point.
 */
async function main(): Promise<void> {
  // Initialize tools before starting server
  await initializeTools();

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
      tools: buildToolsList(),
    };
  });

  // Handle call tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args || {}) as Record<string, unknown>;

    // Check if it's a chained tool
    if (chainedTools.has(name)) {
      const chainedInfo = chainedTools.get(name)!;
      const result = await callChainedTool(chainedInfo, toolArgs);
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
    if (passthroughTools.has(name)) {
      const toolInfo = passthroughTools.get(name)!;
      const result = await callPassthroughTool(toolInfo, toolArgs);
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