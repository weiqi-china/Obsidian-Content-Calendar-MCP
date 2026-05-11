import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

declare function createServer(): Promise<McpServer>;

export { createServer };
