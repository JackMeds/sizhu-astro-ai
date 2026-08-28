import { runStdioServer } from "./stdio.js";

export { createMingXuMcpServer } from "./server.js";
export { handleMcpHttpRequest } from "./http.js";
export { runStdioServer } from "./stdio.js";

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  runStdioServer().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
