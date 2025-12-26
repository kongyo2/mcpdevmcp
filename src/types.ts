/**
 * Type definitions for mcpdev-mcp-server
 */

/**
 * Error types for Inspector CLI operations
 */
export type InspectorErrorKind =
    | "SPAWN_FAILED"
    | "EXECUTION_FAILED"
    | "PARSE_FAILED"
    | "TIMEOUT"
    | "INVALID_RESPONSE"
    | "CONNECTION_FAILED";

export interface InspectorError {
    readonly kind: InspectorErrorKind;
    readonly message: string;
    readonly details?: string;
}

/**
 * Transport type for MCP connection
 */
export type TransportType = "stdio" | "sse" | "http";

/**
 * Target MCP server configuration
 */
export interface TargetServer {
    readonly target: string; // Command or URL
    readonly transport?: TransportType;
    readonly env?: Record<string, string>;
}

/**
 * Tool definition from MCP server
 */
export interface McpTool {
    readonly name: string;
    readonly description?: string;
    readonly inputSchema?: Record<string, unknown>;
}

/**
 * Resource definition from MCP server
 */
export interface McpResource {
    readonly uri: string;
    readonly name?: string;
    readonly description?: string;
    readonly mimeType?: string;
}

/**
 * Prompt definition from MCP server
 */
export interface McpPrompt {
    readonly name: string;
    readonly description?: string;
    readonly arguments?: Array<{
        readonly name: string;
        readonly description?: string;
        readonly required?: boolean;
    }>;
}

/**
 * Result of tools/list method
 */
export interface ToolsListResult {
    readonly tools: McpTool[];
}

/**
 * Result of tools/call method
 */
export interface ToolCallResult {
    readonly content: Array<{
        readonly type: string;
        readonly text?: string;
    }>;
    readonly isError?: boolean;
}

/**
 * Result of resources/list method
 */
export interface ResourcesListResult {
    readonly resources: McpResource[];
}

/**
 * Result of resources/read method
 */
export interface ResourceReadResult {
    readonly contents: Array<{
        readonly uri: string;
        readonly mimeType?: string;
        readonly text?: string;
        readonly blob?: string;
    }>;
}

/**
 * Result of prompts/list method
 */
export interface PromptsListResult {
    readonly prompts: McpPrompt[];
}

/**
 * Result of prompts/get method
 */
export interface PromptGetResult {
    readonly description?: string;
    readonly messages: Array<{
        readonly role: string;
        readonly content: {
            readonly type: string;
            readonly text?: string;
        };
    }>;
}
