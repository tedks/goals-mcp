# Goals MCP

An MCP server for [Goals](https://goalsapp.org). Help a person understand their
goals, discuss obstacles, plan actions and record progress in their own words.
The person stays responsible for their wishes and reflection; sprint reviews
are completed in Goals.

## Choose your access route

**API/MCP data access requires paid, active Sync.** It works on your cloud-synced
records. Local-only data stays on your device; the API has no remote dataset to
read. Non-paying users can use **computer-use agents** in their existing Goals
app, without a Goals API token or Sync subscription.

Both routes use the same public [agent priming](docs/AGENTS.md) and
[human overview](docs/how-goals-works.md), covering WOOP, the planning/review rhythm
and hidden sprint rewards. See the [connection guide](docs/agent-setup.md) for the
computer-use path as well as API/MCP setup. These docs need no account or payment.

## Connect the MCP server

You need **Node.js 22 or later**, npm, a synced Goals account with paid, active **Sync**,
and an MCP client that supports local stdio servers.

1. Open [Goals](https://goalsapp.org), sign in and use **Settings → Sync Now**.
2. In **Settings → Agent access → Manage Agent Access**, create a named token.
   Access is read-only by default; enable updates only if wanted. Save the secret
   when shown. Tokens default to 90 days; choose a different positive number of
   days or **Never expires** if wanted. You can revoke them at any time.
3. Add this configuration to your MCP client, replacing the token placeholder:

```json
{
  "mcpServers": {
    "goals": {
      "command": "npx",
      "args": [
        "--yes",
        "--ignore-scripts",
        "--package=https://github.com/tedks/goals-mcp/releases/download/v0.1.2/tedks-goals-mcp-0.1.2.tgz",
        "goals-mcp"
      ],
      "env": {
        "GOALS_API_URL": "https://goalsapp.org",
        "GOALS_API_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

This package is distributed through the exact GitHub release URL above. It is
not published on the npm registry; do not substitute `npx @tedks/goals-mcp`.

The first launch downloads the pinned release and its dependencies. Keep the
token in the client's secret/environment configuration, outside prompts and
version control. Restart or reconnect your client after saving configuration.
On Windows, a client that cannot find `npx` may require the `npx.cmd` executable
or the direct Node setup in the [connection guide](docs/agent-setup.md).

Ask your agent: “Check my Goals workflow, then help me plan. Ask me one question
at a time.” It should call `get_workflow` first. If a review is due, complete it
in Goals and sync before making changes through the agent.

## Documentation

- [Connection guide](docs/agent-setup.md): installation, token rotation, client
  configuration, troubleshooting and direct API examples.
- [API reference](docs/agent-api.md): endpoints, authentication, input contracts,
  versions, review gates and supported workflows.
- [Agent instructions](docs/AGENTS.md): shared priming for API/MCP and computer-use agents.
- [How Goals works](docs/how-goals-works.md): WOOP, the sprint design and working with an agent.
- [Changelog](CHANGELOG.md) and [releases](https://github.com/tedks/goals-mcp/releases).

Eight tools: `get_workflow`, `list_records`, `get_record`, `create_vision`,
`update_vision`, `create_action`, `update_action`, `set_habit_check_in`.
Resources: `goals://workflow`, `goals://guide`, `goals://schema`.
Prompt: `plan_with_person`.

The server uses stdio and makes HTTPS requests to the configured API. It does
not listen on a network port. Remote-only MCP clients are not supported by this
release. Use a computer-use agent for local-only data through the app.

## Develop and contribute

Clone this repository, then run `npm ci --ignore-scripts`, `npm run build`, and
`npm test` with Node.js 22 or later. The tests use a local fixture API and synthetic
tokens, without a Goals subscription or account. See [AGENTS.md](AGENTS.md).

This repository is the public distribution of the Goals MCP adapter. Its source
and API contracts are exported together from the Goals development repository.
Report bugs or propose changes here; maintainers integrate accepted fixes into
the shared source before the next release. This avoids divergent API and MCP
validation. Releases contain compiled JavaScript and source; the hosted Goals
service and Sync subscription are separate.

## License

Copyright (C) 2026 Ted Smith.

Goals MCP is licensed under the [GNU Affero General Public License, version 3
only](LICENSE) (`AGPL-3.0-only`). This covers all original files in this public
distribution. The MIT designation in the initial publication
was a mistake and did not reflect the owner's intended license. That release
has been withdrawn; use v0.1.1 or later. Third-party dependencies retain their
own licenses.
