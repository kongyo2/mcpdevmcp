import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { execCommand, parseJson } from "../utils/result.js";
import type {
    InspectorError,
    TargetServer,
    ToolsListResult,
    ToolCallResult,
    ResourcesListResult,
    ResourceReadResult,
    PromptsListResult,
    PromptGetResult,
} from "../types.js";

/**
 * Inspector CLI method types
 */
type InspectorMethod =
    | "tools/list"
    | "tools/call"
    | "resources/list"
    | "resources/read"
    | "prompts/list"
    | "prompts/get";

/**
 * Build CLI arguments for Inspector
 */
function buildCliArgs(
    method: InspectorMethod,
    target: TargetServer,
    methodArgs?: Record<string, unknown>
): string[] {
    const args: string[] = ["@modelcontextprotocol/inspector", "--cli"];

    // Add method
    args.push("--method", method);

    // Add transport if specified
    if (target.transport) {
        args.push("--transport", target.transport);
    }

    // Add environment variables
    if (target.env) {
        for (const [key, value] of Object.entries(target.env)) {
            args.push("-e", `${key}=${value}`);
        }
    }

    // Add method arguments as JSON
    if (methodArgs && Object.keys(methodArgs).length > 0) {
        args.push("--json", JSON.stringify(methodArgs));
    }

    // Add target (command or URL)
    args.push(target.target);

    return args;
}

/**
 * Run Inspector CLI command and return parsed result
 */
function runInspectorCli<T>(
    method: InspectorMethod,
    target: TargetServer,
    methodArgs?: Record<string, unknown>,
    timeoutMs?: number
): ResultAsync<T, InspectorError> {
    const args = buildCliArgs(method, target, methodArgs);

    return execCommand("npx", args, { timeoutMs: timeoutMs ?? 60000 }).andThen(
        (output) => {
            // Inspector CLI outputs JSON to stdout
            const trimmedOutput = output.trim();
            const jsonStr = trimmedOutput || "{}";
            const parseResult = parseJson<T>(jsonStr);

            if (parseResult.isOk()) {
                return okAsync(parseResult.value);
            }
            return errAsync(parseResult.error);
        }
    );
}

/**
 * List tools from target MCP server
 */
export function listTools(
    target: TargetServer,
    timeoutMs?: number
): ResultAsync<ToolsListResult, InspectorError> {
    return runInspectorCli<ToolsListResult>("tools/list", target, undefined, timeoutMs);
}

/**
 * Call a tool on target MCP server
 */
export function callTool(
    target: TargetServer,
    toolName: string,
    toolArgs?: Record<string, unknown>,
    timeoutMs?: number
): ResultAsync<ToolCallResult, InspectorError> {
    return runInspectorCli<ToolCallResult>(
        "tools/call",
        target,
        { name: toolName, arguments: toolArgs ?? {} },
        timeoutMs
    );
}

/**
 * List resources from target MCP server
 */
export function listResources(
    target: TargetServer,
    timeoutMs?: number
): ResultAsync<ResourcesListResult, InspectorError> {
    return runInspectorCli<ResourcesListResult>("resources/list", target, undefined, timeoutMs);
}

/**
 * Read a resource from target MCP server
 */
export function readResource(
    target: TargetServer,
    uri: string,
    timeoutMs?: number
): ResultAsync<ResourceReadResult, InspectorError> {
    return runInspectorCli<ResourceReadResult>(
        "resources/read",
        target,
        { uri },
        timeoutMs
    );
}

/**
 * List prompts from target MCP server
 */
export function listPrompts(
    target: TargetServer,
    timeoutMs?: number
): ResultAsync<PromptsListResult, InspectorError> {
    return runInspectorCli<PromptsListResult>("prompts/list", target, undefined, timeoutMs);
}

/**
 * Get a prompt from target MCP server
 */
export function getPrompt(
    target: TargetServer,
    promptName: string,
    promptArgs?: Record<string, string>,
    timeoutMs?: number
): ResultAsync<PromptGetResult, InspectorError> {
    return runInspectorCli<PromptGetResult>(
        "prompts/get",
        target,
        { name: promptName, arguments: promptArgs ?? {} },
        timeoutMs
    );
}
