/**
 * Result type utilities using neverthrow
 * Following ts-error-handling skill: NEVER throw exceptions
 */

import { Result, ok, err, ResultAsync } from "neverthrow";
import { spawn } from "child_process";
import type { InspectorError, InspectorErrorKind } from "../types.js";

/**
 * Create an InspectorError
 */
export function inspectorError(
    kind: InspectorErrorKind,
    message: string,
    details?: string
): InspectorError {
    return { kind, message, details };
}

/**
 * Execute a command and return Result
 * NEVER throws - all errors are wrapped in Result
 */
export function execCommand(
    command: string,
    args: string[],
    options?: {
        cwd?: string;
        env?: Record<string, string>;
        timeoutMs?: number;
        shell?: boolean;
    }
): ResultAsync<string, InspectorError> {
    return ResultAsync.fromPromise(
        new Promise<string>((resolve, reject) => {
            const timeout = options?.timeoutMs ?? 30000;
            let stdout = "";
            let stderr = "";
            let timedOut = false;

            const proc = spawn(command, args, {
                cwd: options?.cwd,
                env: { ...process.env, ...options?.env },
                shell: options?.shell ?? true,
                stdio: ["pipe", "pipe", "pipe"],
            });

            const timer = setTimeout(() => {
                timedOut = true;
                proc.kill("SIGTERM");
            }, timeout);

            proc.stdout.on("data", (data: Buffer) => {
                stdout += data.toString();
            });

            proc.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });

            proc.on("error", (error: Error) => {
                clearTimeout(timer);
                reject(
                    inspectorError("SPAWN_FAILED", `Failed to spawn command: ${command}`, error.message)
                );
            });

            proc.on("close", (code: number | null) => {
                clearTimeout(timer);
                if (timedOut) {
                    reject(
                        inspectorError("TIMEOUT", `Command timed out after ${timeout}ms`, stderr)
                    );
                } else if (code !== 0) {
                    reject(
                        inspectorError(
                            "EXECUTION_FAILED",
                            `Command exited with code ${code}`,
                            stderr || stdout
                        )
                    );
                } else {
                    resolve(stdout);
                }
            });
        }),
        (error): InspectorError => {
            if (isInspectorError(error)) {
                return error;
            }
            return inspectorError(
                "SPAWN_FAILED",
                "Unknown error during command execution",
                String(error)
            );
        }
    );
}

/**
 * Type guard for InspectorError
 */
function isInspectorError(value: unknown): value is InspectorError {
    return (
        typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        "message" in value
    );
}

/**
 * Parse JSON string to Result
 * NEVER throws - parse errors are wrapped in Result
 */
export function parseJson<T>(jsonString: string): Result<T, InspectorError> {
    try {
        const parsed = JSON.parse(jsonString) as T;
        return ok(parsed);
    } catch (error) {
        return err(
            inspectorError(
                "PARSE_FAILED",
                "Failed to parse JSON response",
                error instanceof Error ? error.message : String(error)
            )
        );
    }
}

/**
 * Format InspectorError for display
 */
export function formatError(error: InspectorError): string {
    let message = `Error [${error.kind}]: ${error.message}`;
    if (error.details) {
        message += `\nDetails: ${error.details}`;
    }
    return message;
}
