/**
 * Tool registry for discovering and managing chained and passthrough tools.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { loadAllConfigs, validateChainsConfig } from "./config.js";
import { MCPClientManager } from "./mcp-client.js";
import {
  getToolUniqueName,
  buildChainedToolName,
  buildChainedDescription,
  buildChainedSchema,
} from "./tool-builder.js";
import type {
  ToolInfo,
  ChainedToolInfo,
  ParsedChainTarget,
} from "./types.js";

/** Registry state containing all discovered tools */
export interface ToolRegistryState {
  allTools: Map<string, ToolInfo[]>;
  chainedTools: Map<string, ChainedToolInfo>;
  passthroughTools: Map<string, ToolInfo>;
  clientManager: MCPClientManager;
}

/**
 * Parse a chain target key to extract server name and optional tool name.
 * Format: "serverName" or "serverName/toolName"
 * @param chainKey - The chain configuration key
 * @returns Parsed chain target with server name and optional tool name
 */
export function parseChainTarget(chainKey: string): ParsedChainTarget {
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
 * Find a tool by name across all servers.
 * Supports multiple formats:
 * - "toolName" - finds first tool with that name
 * - "serverName/toolName" - finds specific tool from specific server
 * - "serverName_toolName" - finds tool with underscore-prefixed name
 * @param toolNameOrPath - The tool name or path to search for
 * @param serverTools - Map of all server tools
 * @returns The found tool or undefined
 */
export function findToolByName(
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
 * @param serverName - The server name
 * @param toolName - The tool name
 * @param serverTools - Map of all server tools
 * @returns The found tool or undefined
 */
export function findToolByServerAndName(
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
 * @param clientManager - The MCP client manager
 * @returns The registry state with all discovered tools
 */
export async function initializeToolRegistry(
  clientManager: MCPClientManager
): Promise<ToolRegistryState> {
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
  const allTools = await clientManager.discoverAllTools();

  // Build set of tools that are part of chains (as "A" tools - trigger tools)
  const chainedATools = new Set<string>();
  for (const chainConfig of Object.values(chainsConfig.chains)) {
    for (const toolPath of chainConfig.afterTools) {
      chainedATools.add(toolPath);
      // Also add just the tool name for passthrough exclusion
      const parsed = parseChainTarget(toolPath);
      if (parsed.toolName) {
        chainedATools.add(parsed.toolName);
      }
    }
  }

  // Track specific B tools and full chain servers
  const chainedBTools = new Set<string>();
  const fullChainServers = new Set<string>();

  for (const chainKey of Object.keys(chainsConfig.chains)) {
    const target = parseChainTarget(chainKey);
    if (target.toolName) {
      chainedBTools.add(`${target.serverName}/${target.toolName}`);
    } else {
      fullChainServers.add(target.serverName);
    }
  }

  // Track servers marked as forChained
  const forChainedServers = new Set<string>();
  for (const [serverName, config] of Object.entries(serversConfig.mcpServers)) {
    if (config.forChained === true) {
      forChainedServers.add(serverName);
    }
  }

  // Process chains - create chained tool for each (A tool, B tool) pair
  const chainedTools = new Map<string, ChainedToolInfo>();

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
      const specificTool = findToolByServerAndName(target.serverName, target.toolName, allTools);
      if (!specificTool) {
        console.error(`Warning: Chain tool not found: ${target.serverName}/${target.toolName}`);
        continue;
      }
      bTools = [specificTool];
    } else {
      bTools = serverTools;
    }

    // For each trigger tool in afterTools
    for (const triggerToolPath of chainConfig.afterTools) {
      const toolA = findToolByName(triggerToolPath, allTools);
      if (!toolA) {
        console.error(`Warning: Trigger tool not found: ${triggerToolPath}`);
        continue;
      }

      // For each B tool, create a chained tool
      for (const toolB of bTools) {
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
  const passthroughTools = new Map<string, ToolInfo>();

  for (const [serverName, tools] of allTools) {
    for (const tool of tools) {
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

  console.error(
    `Initialized ${chainedTools.size} chained tools and ${passthroughTools.size} passthrough tools`
  );

  return {
    allTools,
    chainedTools,
    passthroughTools,
    clientManager,
  };
}

/**
 * Build the list of all exposed tools for the MCP server.
 * @param chainedTools - Map of chained tools
 * @param passthroughTools - Map of passthrough tools
 * @returns Array of Tool objects for the MCP server
 */
export function buildToolsList(
  chainedTools: Map<string, ChainedToolInfo>,
  passthroughTools: Map<string, ToolInfo>
): Tool[] {
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
