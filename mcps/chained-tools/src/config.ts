/**
 * Configuration loading for chained-tools MCP server.
 */

import { readFileSync } from "fs";
import type { MCPServersConfig, ChainsConfig } from "./types.js";

/**
 * Get configuration file paths from environment variables.
 */
export function getConfigPaths(): { serversPath: string; chainsPath: string } {
  const serversPath = process.env.MCP_SERVERS_CONFIG;
  const chainsPath = process.env.MCP_CHAINS_CONFIG;

  if (!serversPath) {
    throw new Error(
      "MCP_SERVERS_CONFIG environment variable is not set. " +
        "It should point to your mcp.json file."
    );
  }

  if (!chainsPath) {
    throw new Error(
      "MCP_CHAINS_CONFIG environment variable is not set. " +
        "It should point to your mcp-chained.json file."
    );
  }

  return { serversPath, chainsPath };
}

/**
 * Load and parse the MCP servers configuration file.
 */
export function loadServersConfig(configPath: string): MCPServersConfig {
  const content = readFileSync(configPath, "utf-8");
  return JSON.parse(content) as MCPServersConfig;
}

/**
 * Load and parse the chains configuration file.
 */
export function loadChainsConfig(configPath: string): ChainsConfig {
  const content = readFileSync(configPath, "utf-8");
  return JSON.parse(content) as ChainsConfig;
}

/**
 * Load all configuration files.
 */
export function loadAllConfigs(): {
  serversConfig: MCPServersConfig;
  chainsConfig: ChainsConfig;
} {
  const { serversPath, chainsPath } = getConfigPaths();
  const serversConfig = loadServersConfig(serversPath);
  const chainsConfig = loadChainsConfig(chainsPath);

  return { serversConfig, chainsConfig };
}

/**
 * Validate that chains reference valid servers.
 */
export function validateChainsConfig(
  serversConfig: MCPServersConfig,
  chainsConfig: ChainsConfig
): string[] {
  const warnings: string[] = [];
  const serverNames = new Set(Object.keys(serversConfig.mcpServers));

  for (const chainServer of Object.keys(chainsConfig.chains)) {
    if (!serverNames.has(chainServer)) {
      warnings.push(`Chain references unknown server: ${chainServer}`);
    }
  }

  return warnings;
}
