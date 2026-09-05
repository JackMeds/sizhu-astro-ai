#!/usr/bin/env node
import { runStdioServer } from "../dist/index.js";

runStdioServer().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
