"""Code Thinking MCP Server - Thinking frameworks for LLM code reasoning."""

from code_thinking.server import mcp

def main():
    """Entry point for the MCP server."""
    mcp.run()

__all__ = ["main", "mcp"]
