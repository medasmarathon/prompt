/**
 * Tool executor for running chained and passthrough tool calls.
 */

import { MCPClientManager } from "./mcp-client.js";
import type { ToolInfo, ChainedToolInfo } from "./types.js";

/**
 * Execute a chained tool call by running tool A first, then tool B.
 * @param chainedInfo - Information about the chained tool
 * @param args - The arguments containing params for both tools
 * @param clientManager - The MCP client manager for making tool calls
 * @returns Array of [resultA, resultB] from both tool executions
 */
export async function executeChainedTool(
  chainedInfo: ChainedToolInfo,
  args: Record<string, unknown>,
  clientManager: MCPClientManager
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
 * Execute a passthrough tool call by forwarding to the underlying server.
 * @param toolInfo - Information about the passthrough tool
 * @param args - The arguments for the tool
 * @param clientManager - The MCP client manager for making tool calls
 * @returns The result from the tool execution
 */
export async function executePassthroughTool(
  toolInfo: ToolInfo,
  args: Record<string, unknown>,
  clientManager: MCPClientManager
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
