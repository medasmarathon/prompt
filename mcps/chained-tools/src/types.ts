/**
 * Type definitions for chained-tools MCP server.
 */

/** JSON Schema type for tool input - matches MCP SDK expectations */
export interface ToolInputSchema {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
  [key: string]: unknown;
}

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
   * Supports template placeholders:
   * - {{previous_description}} - Tool A description
   * - {{current_description}} - Tool B description
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
  inputSchema: ToolInputSchema;
  serverName: string;
}

/** Information about a chained tool */
export interface ChainedToolInfo {
  exposedName: string;
  toolA: ToolInfo;
  toolB: ToolInfo;
  description: string;
  inputSchema: ToolInputSchema;
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