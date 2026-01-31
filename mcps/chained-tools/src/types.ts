/**
 * Type definitions for chained-tools MCP server.
 */

/** Configuration for a single MCP server (Claude Desktop compatible) */
export interface ServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  /** If true, this server's tools are only used for chaining, not exposed as standalone tools */
  forChained?: boolean;
}

/** Root configuration for mcp.json file */
export interface MCPServersConfig {
  mcpServers: Record<string, ServerConfig>;
}

/** 
 * Configuration for a single chain.
 * The key in the chains object can be:
 * - "serverName" - uses ALL tools from that server
 * - "serverName/toolName" - uses only the specific tool from that server
 */
export interface ChainConfig {
  /** List of trigger tools (A tools) that will be chained with B tools */
  afterTools: string[];
  /** 
   * Optional description override for the chained tool.
   * Use {{previous_description}} to include the auto-generated description.
   * Example: "{{previous_description}} This combination is useful for caching."
   */
  description?: string;
}

/** Root configuration for mcp-chained.json file */
export interface ChainsConfig {
  chains: Record<string, ChainConfig>;
}

/** Information about a tool from an MCP server */
export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

/** Information about a chained tool */
export interface ChainedToolInfo {
  exposedName: string;
  toolA: ToolInfo;
  toolB: ToolInfo;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Result from calling a tool */
export interface ToolCallResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Parsed chain target from the chains config key.
 * Represents either a full server (all tools) or a specific server/tool.
 */
export interface ParsedChainTarget {
  serverName: string;
  toolName?: string; // undefined means all tools from the server
}