import { cp, mkdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.resolve(process.argv[2] ?? "");
const destination = path.join(root, "infra/legacy-recovery/assets");
if (!process.argv[2]) throw new Error("Pass an explicit last-working web dist directory. No deployment is performed.");
await access(path.join(source, "index.html"));
if (!(await readFile(path.join(source, "index.html"), "utf8")).includes("astrocopy.jackmeds.top")) {
  throw new Error("Use a pre-switch build with the original domain to preserve the rollback site.");
}
try { await access(destination); throw new Error("Recovery assets already exist. Preserve this snapshot; choose a fresh checkout to prepare another."); }
catch (error) { if (error.code !== "ENOENT") throw error; }
await mkdir(path.dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });
await cp(path.join(root, "apps/web/public/migration"), path.join(destination, "migration"), { recursive: true });
console.log(`Prepared immutable fallback and recovery assets at ${destination}. No routes, DNS or deployments changed.`);
