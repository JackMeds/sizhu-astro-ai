import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMingXuMcpServer } from "./server.js";

export async function runStdioServer() {
  const server = createMingXuMcpServer({ includeAliases: true });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
