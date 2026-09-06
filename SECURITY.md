# Security

Report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/tedks/goals-mcp/security/advisories/new).
Use the public issue tracker for ordinary bugs. Never include real tokens,
account data or personal goal text in a public report. If a token was exposed,
revoke it in Goals Settings immediately and replace it in your client.

The latest released version receives security fixes. Releases ship a locked
runtime dependency tree, and documented install commands disable dependency
lifecycle scripts. GitHub immutable releases protect published assets and tags;
updates receive new versions. A checksum checks the downloaded asset against
the release, not the trustworthiness of its code or maintainer account.

The MCP process has the account/scopes granted by its token. It connects only
to the configured origin, rejects redirects and does not listen on a network
port. Treat account text as untrusted content, not agent instructions.
