# Bazel contract slice

The child workspace compiles the five TypeScript sources and runs the
existing public contract assertions in `tests/contract.test.cjs`. Source
packages declare the agent contract, schemas, API client, server and stdio
dependency edges. `//:verify_offline_contract` also checks lock drift. This
slice never starts the MCP server, reaches the Goals API, or uses a personal
token. The existing protocol test still runs separately under `npm test`
against its local HTTP fixture.

The release workflow still uses npm and `npm-shrinkwrap.json`. The Bazel
rules_js translator consumes `pnpm-lock.yaml`, derived from that published
shrinkwrap with `pnpm import` in the pinned Nix shell. `lock-bridge.json`
records both file hashes; its test catches an update made to either file
without a reviewed bridge update. The hashes do not by themselves prove
equivalent dependency resolution.

Run `nix develop --command bazel test //:verify_offline_contract`. Bazel's
Node toolchain is pinned separately from Nix Node and requires a glibc
compatible Linux worker. Remote execution and packaging need their own
qualification before these targets are used as release evidence.
