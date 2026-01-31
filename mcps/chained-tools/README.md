# Chained Tools MCP Server

An MCP server that chains MCP tools together for composite operations. It allows you to automatically invoke a second tool after a first tool completes, enabling powerful tool composition patterns.

**Built with TypeScript for true dynamic tool registration** - tools are discovered at runtime and exposed directly to clients, not wrapped in meta-tools.

## Features

- **True Dynamic Tools**: Tools are discovered at runtime and exposed with proper schemas
- **Tool Chaining**: Automatically invoke tool B after tool A completes
- **Specific Tool Targeting**: Chain specific tools using `serverName/toolName` format
- **Custom Descriptions**: Override chained tool descriptions with `{{previous_description}}` and `{{current_description}}` templates
- **Passthrough Support**: Tools not in any chain are exposed normally
- **forChained Flag**: Mark servers as "chained-only" to prevent their tools from being exposed as standalone
- **Name Conflict Resolution**: Automatically prefixes tool names with server name when conflicts occur
- **Combined Schemas**: Chained tools expose a combined input schema for both tools

## Installation

```bash
cd mcps/chained-tools
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MCP_SERVERS_CONFIG` | Path to mcp.json containing all MCP server configurations |
| `MCP_CHAINS_CONFIG` | Path to mcp-chained.json containing chain definitions |

### mcp.json Format

This follows the Claude Desktop configuration format with an additional `forChained` field:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx|uvx|node|python",
      "args": ["arg1", "arg2"],
      "env": { "KEY": "value" },
      "forChained": false
    }
  }
}
```

#### Server Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Command to run the MCP server |
| `args` | string[] | No | Arguments to pass to the command |
| `env` | object | No | Environment variables for the server |
| `forChained` | boolean | No | If `true`, this server's tools are only used for chaining and NOT exposed as standalone passthrough tools |

### mcp-chained.json Format

```json
{
  "chains": {
    "serverName": {
      "afterTools": ["tool1", "tool2"],
      "description": "Optional custom description with {{previous_description}} and {{current_description}}"
    },
    "serverName/specificTool": {
      "afterTools": ["tool3"]
    }
  }
}
```

#### Chain Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `afterTools` | string[] | Yes | List of trigger tools (A tools) that will be chained with B tools |
| `description` | string | No | Custom description template with placeholder support |

#### Chain Key Formats

| Format | Description | Example |
|--------|-------------|---------|
| `serverName` | Use ALL tools from the server as B tools | `"memory": { "afterTools": [...] }` |
| `serverName/toolName` | Use ONLY the specific tool as B tool | `"memory/store_memory": { "afterTools": [...] }` |

#### Custom Description Template

The `description` field supports two template placeholders:

| Placeholder | Description |
|-------------|-------------|
| `{{previous_description}}` | The description of tool A (the first/trigger tool) |
| `{{current_description}}` | The description of tool B (the chained/target tool) |

For a chain `tool A -> tool B`:
- `{{previous_description}}` = Tool A's description
- `{{current_description}}` = Tool B's description

**Default description format** (when no custom description is provided):
```
<Tool A description>

FINALLY
<Tool B description>
```

**Example with custom description:**
```json
{
  "chains": {
    "memory/store_memory": {
      "afterTools": ["read_file"],
      "description": "{{previous_description}}\n\nThen caches the result:\n{{current_description}}\n\nUse this to read and cache file content."
    }
  }
}
```

This produces a description like:
```
Reads a file from the filesystem.

Then caches the result:
Stores content in memory.

Use this to read and cache file content.
```

## Tool Exposure Rules

1. **Non-chained tools**: Exposed with their original name (e.g., `tool_name`), or prefixed with server name if there's a conflict (e.g., `server_tool_name`)

2. **Chained tools**: Exposed as `chained_<A-tool>_with_<B-tool>`
   - Tool names are prefixed with server name only if not unique
   - Each trigger tool (A) is paired with specified B tools

3. **Passthrough exclusions**: A tool is NOT exposed as passthrough if:
   - It's listed in any `afterTools` array (A tools)
   - It's a specific B tool mentioned in chains (`serverName/toolName` format)
   - It's from a server that has all tools chained (`serverName` format)
   - It's from a server marked with `forChained: true`

4. **Chained tool results**: Returns an array `[<A result>, <B result>]`

5. **Chained tool descriptions**: Combined format (can be overridden with `description` field):
   ```
   <A tool description>

   FINALLY
   <B tool description>
   ```

6. **Chained tool schemas**: Nested object:
   ```json
   {
     "<A tool name>": { <A params> },
     "<B tool name>": { <B params> }
   }
   ```

## Usage

### Running the Server

```bash
# Set environment variables
export MCP_SERVERS_CONFIG=/path/to/mcp.json
export MCP_CHAINS_CONFIG=/path/to/mcp-chained.json

# Run the server
npm start
```

Or with npx (after publishing):

```bash
npx chained-tools
```

### Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "chained-tools": {
      "command": "node",
      "args": ["/path/to/chained-tools/dist/index.js"],
      "env": {
        "MCP_SERVERS_CONFIG": "/path/to/mcp.json",
        "MCP_CHAINS_CONFIG": "/path/to/mcp-chained.json"
      }
    }
  }
}
```

### Example: Complete Configuration

```json
// mcp.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "forChained": true
    }
  }
}

// mcp-chained.json
{
  "chains": {
    "memory/store_memory": {
      "afterTools": ["read_file"],
      "description": "{{previous_description}}\n\nThen: {{current_description}}\n\nUse this to read and cache file content."
    }
  }
}
```

With this configuration:
- `filesystem` tools are exposed as passthrough (e.g., `list_allowed_directories`)
- `read_file` is exposed ONLY through the chained tool `chained_read_file_with_store_memory`
- `memory/store_memory` is used in the chain with custom description
- `memory/get_memory` is NOT exposed at all (because `forChained: true` and it's not mentioned)

## Example Configuration

See the `examples/` directory for sample configuration files:

- `examples/mcp.json` - Sample MCP servers configuration (with `forChained` example)
- `examples/mcp-chained.json` - Sample chain definitions (with specific tool targeting and description)

## Architecture

```
+-------------------------------------------------------------+
|                    Chained Tools Server                      |
+-------------------------------------------------------------+
|  +-----------+  +-------------+  +----------------------+   |
|  |  Config   |  |    MCP      |  |   Dynamic Tool       |   |
|  |  Loader   |  |   Client    |  |   Registry           |   |
|  | (ts)      |  |   Manager   |  |   (runtime built)    |   |
|  +-----------+  +-------------+  +----------------------+   |
+-------------------------------------------------------------+
|                   MCP Server (stdio)                         |
|     - ListToolsRequestSchema -> dynamic tools list           |
|     - CallToolRequestSchema -> route to chained/passthrough  |
+-------------------------------------------------------------+
                            |
          +-----------------+-----------------+
          v                 v                 v
    +----------+      +----------+      +----------+
    | Server A |      | Server B |      | Server C |
    | (stdio)  |      | (stdio)  |      | (stdio)  |
    +----------+      +----------+      +----------+
```

## Why TypeScript?

This server uses TypeScript instead of Python because:

1. **True Dynamic Tools**: The TypeScript MCP SDK allows tools to be registered at runtime via request handlers
2. **Handler-Based API**: `server.setRequestHandler(ListToolsRequestSchema, ...)` enables fully dynamic tool lists
3. **Better MCP Ecosystem Integration**: Most official MCP servers are TypeScript-based
4. **Direct Schema Forwarding**: Tool schemas can be forwarded directly without wrapper patterns

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run directly with ts-node (for development)
npx ts-node src/index.ts
```

## Project Structure

```
mcps/chained-tools/
+-- package.json          # Node.js project config
+-- tsconfig.json         # TypeScript config
+-- README.md             # Documentation
+-- src/
|   +-- index.ts          # Main server entry point
|   +-- types.ts          # TypeScript type definitions
|   +-- config.ts         # Configuration loading
|   +-- mcp-client.ts     # MCP client manager
+-- examples/
    +-- mcp.json          # Example servers config
    +-- mcp-chained.json  # Example chains config
```

## License

MIT