/**
 * MCP Inspector tools registration
 * Following mcp-builder skill: use server.registerTool() pattern
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    listTools,
    callTool,
    listResources,
    readResource,
    listPrompts,
    getPrompt,
} from "../services/inspector-cli.js";
import { formatError } from "../utils/result.js";
import type { TransportType } from "../types.js";

/**
 * Zod schema for transport type
 */
const TransportSchema = z.enum(["stdio", "sse", "http"]).optional();

/**
 * Zod schema for target server configuration
 */
const TargetServerSchema = z.object({
    target: z
        .string()
        .min(1)
        .describe(
            "Target MCP server - either a command (e.g., 'node server.js') or URL (e.g., 'https://example.com/sse')"
        ),
    transport: TransportSchema.describe(
        "Transport type: 'stdio' for local commands, 'sse' for SSE URLs, 'http' for streamable HTTP"
    ),
    timeout_ms: z
        .number()
        .int()
        .min(1000)
        .max(300000)
        .default(60000)
        .describe("Timeout in milliseconds (default: 60000)"),
});

/**
 * Register all inspector tools with the MCP server
 */
export function registerInspectorTools(server: McpServer): void {
    // Tool: mcpdev_inspector_list_tools
    server.registerTool(
        "mcpdev_inspector_list_tools",
        {
            title: "List MCP Server Tools",
            description: `List all available tools from a target MCP server.

Use this to discover what tools a target MCP server provides. Returns tool names, descriptions, and input schemas.

Args:
  - target (string): Target MCP server - command (e.g., 'node server.js') or URL
  - transport ('stdio' | 'sse' | 'http'): Transport type (auto-detected if not specified)
  - timeout_ms (number): Timeout in milliseconds (default: 60000)

Returns:
  JSON object with 'tools' array containing tool definitions.

Examples:
  - Local server: { target: "node dist/index.js", transport: "stdio" }
  - Remote SSE: { target: "https://mcp.example.com/sse", transport: "sse" }`,
            inputSchema: TargetServerSchema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
        },
        async (params) => {
            const result = await listTools(
                { target: params.target, transport: params.transport as TransportType },
                params.timeout_ms
            );

            if (result.isErr()) {
                return {
                    content: [{ type: "text", text: formatError(result.error) }],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: "text", text: JSON.stringify(result.value, null, 2) },
                ],
            };
        }
    );

    // Tool: mcpdev_inspector_call_tool
    server.registerTool(
        "mcpdev_inspector_call_tool",
        {
            title: "Call MCP Server Tool",
            description: `Execute a tool on a target MCP server.

Use this to invoke a specific tool on the target server with provided arguments.

Args:
  - target (string): Target MCP server - command or URL
  - transport ('stdio' | 'sse' | 'http'): Transport type
  - timeout_ms (number): Timeout in milliseconds (default: 60000)
  - tool_name (string): Name of the tool to call
  - tool_args (object): Arguments to pass to the tool

Returns:
  The tool's response content.

Examples:
  - { target: "node server.js", tool_name: "get_weather", tool_args: { city: "Tokyo" } }`,
            inputSchema: TargetServerSchema.extend({
                tool_name: z.string().min(1).describe("Name of the tool to call"),
                tool_args: z
                    .record(z.unknown())
                    .default({})
                    .describe("Arguments to pass to the tool"),
            }),
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
        },
        async (params) => {
            const result = await callTool(
                { target: params.target, transport: params.transport as TransportType },
                params.tool_name,
                params.tool_args,
                params.timeout_ms
            );

            if (result.isErr()) {
                return {
                    content: [{ type: "text", text: formatError(result.error) }],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: "text", text: JSON.stringify(result.value, null, 2) },
                ],
            };
        }
    );

    // Tool: mcpdev_inspector_list_resources
    server.registerTool(
        "mcpdev_inspector_list_resources",
        {
            title: "List MCP Server Resources",
            description: `List all available resources from a target MCP server.

Use this to discover what resources (data/content) a target MCP server exposes.

Args:
  - target (string): Target MCP server - command or URL
  - transport ('stdio' | 'sse' | 'http'): Transport type
  - timeout_ms (number): Timeout in milliseconds (default: 60000)

Returns:
  JSON object with 'resources' array containing resource URIs and metadata.`,
            inputSchema: TargetServerSchema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
        },
        async (params) => {
            const result = await listResources(
                { target: params.target, transport: params.transport as TransportType },
                params.timeout_ms
            );

            if (result.isErr()) {
                return {
                    content: [{ type: "text", text: formatError(result.error) }],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: "text", text: JSON.stringify(result.value, null, 2) },
                ],
            };
        }
    );

    // Tool: mcpdev_inspector_read_resource
    server.registerTool(
        "mcpdev_inspector_read_resource",
        {
            title: "Read MCP Server Resource",
            description: `Read a specific resource from a target MCP server.

Use this to fetch the content of a resource by its URI.

Args:
  - target (string): Target MCP server - command or URL
  - transport ('stdio' | 'sse' | 'http'): Transport type
  - timeout_ms (number): Timeout in milliseconds (default: 60000)
  - uri (string): Resource URI to read

Returns:
  The resource content (text or base64-encoded blob).`,
            inputSchema: TargetServerSchema.extend({
                uri: z.string().min(1).describe("Resource URI to read"),
            }),
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
        },
        async (params) => {
            const result = await readResource(
                { target: params.target, transport: params.transport as TransportType },
                params.uri,
                params.timeout_ms
            );

            if (result.isErr()) {
                return {
                    content: [{ type: "text", text: formatError(result.error) }],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: "text", text: JSON.stringify(result.value, null, 2) },
                ],
            };
        }
    );

    // Tool: mcpdev_inspector_list_prompts
    server.registerTool(
        "mcpdev_inspector_list_prompts",
        {
            title: "List MCP Server Prompts",
            description: `List all available prompts from a target MCP server.

Use this to discover what prompt templates a target MCP server provides.

Args:
  - target (string): Target MCP server - command or URL
  - transport ('stdio' | 'sse' | 'http'): Transport type
  - timeout_ms (number): Timeout in milliseconds (default: 60000)

Returns:
  JSON object with 'prompts' array containing prompt definitions.`,
            inputSchema: TargetServerSchema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
        },
        async (params) => {
            const result = await listPrompts(
                { target: params.target, transport: params.transport as TransportType },
                params.timeout_ms
            );

            if (result.isErr()) {
                return {
                    content: [{ type: "text", text: formatError(result.error) }],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: "text", text: JSON.stringify(result.value, null, 2) },
                ],
            };
        }
    );

    // Tool: mcpdev_inspector_get_prompt
    server.registerTool(
        "mcpdev_inspector_get_prompt",
        {
            title: "Get MCP Server Prompt",
            description: `Get a specific prompt from a target MCP server.

Use this to retrieve and render a prompt template with provided arguments.

Args:
  - target (string): Target MCP server - command or URL
  - transport ('stdio' | 'sse' | 'http'): Transport type
  - timeout_ms (number): Timeout in milliseconds (default: 60000)
  - prompt_name (string): Name of the prompt to get
  - prompt_args (object): Arguments to pass to the prompt template

Returns:
  The rendered prompt messages.`,
            inputSchema: TargetServerSchema.extend({
                prompt_name: z.string().min(1).describe("Name of the prompt to get"),
                prompt_args: z
                    .record(z.string())
                    .default({})
                    .describe("Arguments to pass to the prompt template"),
            }),
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
        },
        async (params) => {
            const result = await getPrompt(
                { target: params.target, transport: params.transport as TransportType },
                params.prompt_name,
                params.prompt_args,
                params.timeout_ms
            );

            if (result.isErr()) {
                return {
                    content: [{ type: "text", text: formatError(result.error) }],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: "text", text: JSON.stringify(result.value, null, 2) },
                ],
            };
        }
    );
}
