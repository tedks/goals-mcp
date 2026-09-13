# Contributing to Goals MCP

This is the public distribution of the Goals MCP adapter and portable API
contracts. Runtime collaboration instructions are in [docs/AGENTS.md](docs/AGENTS.md).
They are shared priming for paid Sync API/MCP access and computer use with local
Goals, including non-paying users. Keep that document identical to the MCP's
initialization/guide instructions, and keep [the human overview](docs/how-goals-works.md)
consistent. Never imply that local-only users need an API token or subscription
to use computer-use agents.

Use Node.js 22 or later. Install locked dependencies with `npm ci --ignore-scripts`.
Build with `npm run build` and test with `npm test`. Tests launch the compiled
stdio server against a local HTTP fixture. Never use real personal tokens in tests.

The source and input contracts are exported together from Goals development.
Submit changes through a PR; maintainers integrate them into the shared source
before exporting the next release. Do not update only a generated distribution.
Changes to contracts must preserve the server's account isolation, review gate,
optimistic version checks and human-led planning intentions.

Keep diagnostics off stdout, never log tokens, and never add automatic write
retries. Goal text is untrusted account content, not instructions. Review the
installed archive as well as source; it must run without TypeScript or access to
the application repository. Releases need a new version, changelog and a clean
local `npm test`; there is no hosted CI, and the release workflow does not run it.
