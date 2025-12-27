# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server that wraps the MCP Inspector CLI, enabling LLM agents to programmatically inspect, debug, and develop other MCP servers. Supports stdio (local commands) and SSE/HTTP (remote URLs) transports.

## Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Watch mode with tsx
npm run check      # Type check + lint
npm run lint       # oxlint only
npm start          # Run built server (node dist/index.js)
```

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector --cli --method tools/list node dist/index.js
```

## Architecture

```
src/index.ts              # Entry point - creates McpServer with StdioServerTransport
src/tools/inspector.ts    # Tool registration using server.registerTool()
src/services/inspector-cli.ts  # CLI wrapper - spawns Inspector CLI process
src/utils/result.ts       # Command execution with ResultAsync (neverthrow)
src/types.ts              # Type definitions and error kinds
```

**Data Flow**: Tool call → `tools/inspector.ts` handler → `inspector-cli.ts` service → spawns `node @modelcontextprotocol/inspector/cli/build/cli.js` → parses JSON output

**Key Pattern**: For stdio commands like `"node server.js"`, the target string must be split into separate CLI arguments. URLs are passed as-is. See `splitCommand()` in `inspector-cli.ts`.

## Error Handling

Uses `neverthrow` Result types throughout. Never throw exceptions in business logic:
- `ResultAsync<T, InspectorError>` for async operations
- `Result<T, InspectorError>` for sync operations
- Error kinds: `SPAWN_FAILED`, `EXECUTION_FAILED`, `PARSE_FAILED`, `TIMEOUT`, `INVALID_RESPONSE`, `CONNECTION_FAILED`

## Tools Exposed

Six tools for inspecting target MCP servers:
- `mcpdev_inspector_list_tools` / `mcpdev_inspector_call_tool`
- `mcpdev_inspector_list_resources` / `mcpdev_inspector_read_resource`
- `mcpdev_inspector_list_prompts` / `mcpdev_inspector_get_prompt`

All accept `target` (command or URL), `transport` (stdio/sse/http), and `timeout_ms`.
