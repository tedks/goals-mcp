# Goals MCP

An MCP server for [Goals](https://goalsapp.org). Help a person understand their
goals, discuss obstacles, plan actions and record progress in their own words.
The person stays responsible for their wishes and reflection; sprint reviews
are completed in Goals.

## Connect

You need **Node.js 22 or later**, npm, a synced Goals account with active **Sync**,
and an MCP client that supports local stdio servers.

1. Open [Goals](https://goalsapp.org), sign in and use **Settings → Sync Now**.
2. In **Settings → Agent access → Manage Agent Access**, create a named token.
   Access is read-only by default; enable updates only if wanted. Save the secret
   when shown. Tokens created in the app expire after 30 days and can be revoked.
3. Add this configuration to your MCP client, replacing the token placeholder:

```json
{
  "mcpServers": {
    "goals": {
      "command": "npx",
      "args": [
        "--yes",
        "--ignore-scripts",
        "--package=https://github.com/tedks/goals-mcp/releases/download/v0.1.0/tedks-goals-mcp-0.1.0.tgz",
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
- [Agent instructions](docs/AGENTS.md): the human-led planning and progress flow.
- [Changelog](CHANGELOG.md) and [releases](https://github.com/tedks/goals-mcp/releases).

Eight tools: `get_workflow`, `list_records`, `get_record`, `create_vision`,
`update_vision`, `create_action`, `update_action`, `set_habit_check_in`.
Resources: `goals://workflow`, `goals://guide`, `goals://schema`.
Prompt: `plan_with_person`.

The server uses stdio and makes HTTPS requests to the configured API. It does
not listen on a network port. Remote-only MCP clients are not supported by this
release. Local-only guest data must be synced before agents can access it.

## Develop and contribute

Clone this repository, then run `npm ci --ignore-scripts`, `npm run build`, and
`npm test` with Node.js 22 or later. The tests use a local fixture API and synthetic
tokens, without a Goals subscription or account. See [AGENTS.md](AGENTS.md).

This repository is the public distribution of the Goals MCP adapter. Its source
and API contracts are exported together from the Goals development repository.
Report bugs or propose changes here; maintainers integrate accepted fixes into
the shared source before the next release. This avoids divergent API and MCP
validation. Releases contain compiled JavaScript and source under the MIT license;
the hosted Goals service and Sync subscription are separate.
