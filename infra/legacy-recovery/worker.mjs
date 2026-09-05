const recoveryPaths = new Set(["/migration", "/migration/", "/migration/index.html"]);

export default {
  async fetch(request, env) {
    const source = new URL(request.url);
    if (source.pathname === "/__migration/health") {
      return Response.json({ ready: env.NEW_SITE_READY === "true", recovery: "/migration/" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (recoveryPaths.has(source.pathname)) {
      // Serve at the old origin, where its original localStorage is accessible.
      // The recovery document is standalone: no redirected JS or CSS requests.
      source.pathname = "/migration/index.html";
      source.search = "";
      const response = await env.ASSETS.fetch(new Request(source, request));
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("Referrer-Policy", "no-referrer");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(response.body, { status: response.status, headers });
    }
    if (env.NEW_SITE_READY !== "true") {
      // An immutable copy of the last working static site remains usable while
      // DNS/TLS/new-site checks are pending, and for operational rollback.
      // html_handling=none preserves existing .html guide URLs. Resolve directory
      // indexes explicitly so /, /en/ and /agent/ still serve the snapshot.
      if (source.pathname.endsWith("/")) source.pathname += "index.html";
      const response = await env.ASSETS.fetch(new Request(source, request));
      if (response.status === 404 && !source.pathname.split("/").at(-1).includes(".")) {
        source.pathname += "/index.html";
        const directoryIndex = await env.ASSETS.fetch(new Request(source, request));
        if (directoryIndex.status === 200) {
          // Keep directory-relative links (agent/tools.md, tools.json) correct.
          // Resolve from the incoming URL, never from NEW_ORIGIN while on hold.
          const canonical = new URL(request.url);
          canonical.pathname += "/";
          return new Response(null, { status: 307, headers: { Location: canonical.toString(), "Cache-Control": "no-store" } });
        }
        return directoryIndex;
      }
      return response;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const destination = new URL(env.NEW_ORIGIN);
    if (destination.origin !== "https://mingxu.jackmeds.top") {
      return new Response("Migration destination is not configured", { status: 503 });
    }
    destination.pathname = source.pathname;
    destination.search = source.search;
    return new Response(null, {
      status: 301,
      headers: { Location: destination.toString(), "Cache-Control": "no-store" }
    });
  }
};
