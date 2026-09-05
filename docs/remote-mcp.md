# MingXu Remote MCP

The repository contains a stateless Streamable HTTP MCP handler in `apps/mcp` and Vercel routes in `api/`.

## Local verification

```bash
npm install
npm run build:mcp
npm run start:http -w @mingxu/mcp
node tools/e2e-mcp-http.mjs
```

The local server exposes `http://127.0.0.1:8787/mcp` and `GET /health`.

## Vercel deployment

1. Import this repository as a Vercel project with the repository root as the project root.
2. Add `mcp.jackmeds.top` as a custom domain for that project.
3. Deploy from `main`; `vercel.json` rewrites `/mcp` to `/api/mcp` and `/health` to `/api/health`.
4. Verify `https://mcp.jackmeds.top/health` returns `{ "status": "ok", "service": "MingXu MCP" }`.
5. Run `tools/e2e-mcp-http.mjs` with `MINGXU_MCP_E2E_URL=https://mcp.jackmeds.top`.

The public Registry metadata is in [`server.json`](../server.json). Submit it to the official MCP Registry only after the remote URL is publicly reachable. The registry is a distribution channel, not a runtime dependency.

## Privacy and limits

The handler does not persist sessions, charts, birth data, casting data, questions, or conversation state. Request bodies are limited to 1 MB; questions are limited to 2,000 characters by the shared schema. Metrics log only the tool name, success/error, duration, and timestamp.
