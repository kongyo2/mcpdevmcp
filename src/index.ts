#!/usr/bin/env node
/**
 * MCP Dev Helper - MCP Server for MCP development assistance
 *
 * This server provides tools to help agents develop and debug MCP servers
 * by wrapping the MCP Inspector CLI functionality.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerInspectorTools } from "./tools/inspector.js";

/**
 * Create and configure the MCP server
 */
function createServer(): McpServer {
    const server = new McpServer({
        name: "mcpdev-mcp-server",
        version: "0.1.0",
    });

    // Register inspector tools
    registerInspectorTools(server);

    return server;
}

/**
 * Run the server with stdio transport
 */
async function runStdio(): Promise<void> {
    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Log to stderr (stdio servers should not log to stdout)
    console.error("mcpdev-mcp-server running via stdio");
}

/**
 * Main entry point
 */
runStdio().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
});
