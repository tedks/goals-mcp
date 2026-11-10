import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const expected = JSON.parse(readFileSync(new URL("../lock-bridge.json", import.meta.url)));
for (const name of ["npm-shrinkwrap.json", "pnpm-lock.yaml"]) {
  const actual = createHash("sha256")
    .update(readFileSync(new URL(`../${name}`, import.meta.url)))
    .digest("hex");
  if (actual !== expected[name]) {
    throw new Error(`${name} changed; regenerate and review the Bazel lock bridge`);
  }
}
