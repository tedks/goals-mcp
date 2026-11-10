# Bazel contract slice

The child workspace compiles the five TypeScript sources and runs the
existing public contract assertions in `tests/contract.test.cjs`. Source
packages declare the agent contract, schemas, API client, server and stdio
dependency edges. `//:verify_offline_contract` also checks lock drift. This
slice never starts the MCP server, reaches the Goals API, or uses a personal
token. The existing protocol test still runs separately under `npm test`
against its local HTTP fixture.

The compiler's source labels are the five `js_library` targets themselves,
so their declared local edges are part of the Bazel analysis graph. External
npm packages are linked through the root `:node_modules` target.

The release workflow still uses npm and `npm-shrinkwrap.json`. The Bazel
rules_js translator consumes `pnpm-lock.yaml`, derived from that published
shrinkwrap with `pnpm import` in the pinned Nix shell. `lock-bridge.json`
records both file hashes; its test catches an update made to either file
without a reviewed bridge update. The hashes do not by themselves prove
equivalent dependency resolution.

Goals' `scripts/export-mcp.mjs` source export has an explicit file allowlist
and does not emit these Bazel, flake, pnpm or lock-bridge files. Preserve this
child-owned overlay when refreshing the public distribution. If the exported
shrinkwrap changes, regenerate and review the pnpm lock and bridge hashes in
the child; do not broaden the public export just to carry build files. The
nested `src/*/BUILD.bazel` files and this document live under the package's
existing `src` and `docs` file entries. They will be included in a future
npm tarball; inspect that packed artifact on the Node 22 release path whenever
release content changes. The Bazel module lock must be generated under a
reviewed first-resolution run and committed before the documented test gate.

Run `nix develop --command bazel test //:verify_offline_contract`. Bazel's
Node toolchain is pinned separately from Nix Node and requires a glibc
compatible Linux worker. Remote execution and packaging need their own
qualification before these targets are used as release evidence. In
particular, Bazel Node 24 does not replace the npm packed-install and
protocol tests on the release's Node 22 path.
