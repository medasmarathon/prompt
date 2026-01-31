/**
 * Tool builder utilities for creating chained tool names, descriptions, and schemas.
 */

import type { ToolInfo, ToolInputSchema } from "./types.js";

/**
 * Get a unique name for a tool, prefixing with server name if needed.
 * @param tool - The tool to get a unique name for
 * @param allToolsMap - Map of all tools by server name
 * @returns The unique tool name (possibly prefixed with server name)
 */
export function getToolUniqueName(
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
 * Format: do_<toolA_name>_with_<toolB_name>
 * @param toolA - The first tool in the chain (trigger tool)
 * @param toolB - The second tool in the chain
 * @param allToolsMap - Map of all tools by server name
 * @returns The chained tool name
 */
export function buildChainedToolName(
  toolA: ToolInfo,
  toolB: ToolInfo,
  allToolsMap: Map<string, ToolInfo[]>
): string {
  const aName = getToolUniqueName(toolA, allToolsMap);
  const bName = getToolUniqueName(toolB, allToolsMap);
  return `do_${aName}_with_${bName}`;
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
 * @returns The combined description
 */
export function buildChainedDescription(
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
 * @param toolA - The first tool in the chain
 * @param toolB - The second tool in the chain
 * @returns The combined input schema
 */
export function buildChainedSchema(
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
