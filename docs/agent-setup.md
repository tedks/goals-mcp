# Connect an agent to Goals

The agent API and local MCP server work with your synced cloud account. Sign in,
activate Sync, and use **Settings → Sync Now** to upload your goals first.

## Create a token

In **Settings → Agent access → Manage Agent Access**, name your agent and create
a token. Access defaults to read-only. Enable **Allow updates to goals and
progress** if you want the agent to change plans or record progress. Copy the
secret while it is displayed; it cannot be retrieved later. Tokens expire after
30 days when created in the app. You can revoke them in the same panel, including
after cancelling Sync.

## Start the MCP server

Install Node.js 22 or later (including npm). In clients that accept `mcpServers`
configuration, use this pinned public release:

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

Replace the token placeholder with the secret from Settings. For clients with a
different configuration format, enter the same command, arguments and environment.
The server uses local stdio; clients that only accept a remote MCP URL cannot use
this release. It does not listen on a port. No private repository, Nix or Bazel is
needed to install it. The first launch downloads the release and dependencies.
If your client times out during that download, complete the direct installation
below before reconnecting.

For a different Goals deployment, use its API origin without `/api`, credentials,
a query or fragment. HTTPS is required remotely; HTTP is accepted only for
loopback development (for example `http://127.0.0.1:3001` for the Docker dev stack). Tokens belong to the
issuing deployment. Keep secrets outside version control, chat prompts and shell
history. Restart or reconnect your MCP client after changing its configuration.

### Direct Node installation

If a desktop client cannot find `npx` (or `npx.cmd` on Windows), install the
release into a directory you control:

```sh
npm install --prefix /absolute/path/to/goals-agent --ignore-scripts --omit=dev \
  https://github.com/tedks/goals-mcp/releases/download/v0.1.0/tedks-goals-mcp-0.1.0.tgz
```

Configure `command` as the absolute path to your Node executable and `args` as
`["/absolute/path/to/goals-agent/node_modules/@tedks/goals-mcp/dist/mcp/stdio.js"]`,
with the same two environment values above. Use your platform's paths, escaping
backslashes in JSON on Windows. This also avoids a download check during launch.
Runtime dependencies are locked by the shipped npm shrinkwrap. You can
download the release asset and verify its SHA-256 against `SHA256SUMS`
on the release page before installing the local archive.

### Check the connection

After reconnecting, the client should discover eight tools, three resources and
one prompt. Ask it to run `get_workflow`, then list your visions. An empty list
usually means the app has not synced or the token belongs to a different account.
A `review_required` response is a working connection: complete the review in
Goals and sync. A connected server with no successful API request has only
verified the local MCP process; the first tool call also checks the token and Sync.

The server exposes eight tools:

| Tool | Use |
| --- | --- |
| `get_workflow` | Check whether writes are allowed and read human planning prompts |
| `list_records` | Page through visions, actions, sprints, adaptations and metric/review records |
| `get_record` | Read one record and its current version |
| `create_vision` | Create a vision with a stable ID |
| `update_vision` | Update vision text with a version precondition |
| `create_action` | Create a task or recurring habit |
| `update_action` | Edit actions, complete/reopen tasks, or archive/unarchive actions |
| `set_habit_check_in` | Assert or remove completion for an explicit habit day |

`goals://workflow` reports live write eligibility and planning prompts.
`goals://guide` explains collaboration, retries and calendar preferences.
The `plan_with_person` prompt guides a WOOP conversation without changing records.
`goals://schema` provides the deployed API's write schemas. The server also sends
its guidance during initialization. Sprint reviews and computed metrics are
readable context; their writes stay in the app in this release.

Start with `get_workflow`. If review is required, complete it in Goals and sync
before asking the agent to make changes. Reads remain available for reflection.
An absent or unreadable current sprint also blocks writes until the app syncs a
usable state. Active sprint end times and sampled lengths stay hidden.

Try: “Help me plan: ask about my wish and desired outcome, then discuss what could
get in the way and what I want to try.” The agent should use your answers, read
relevant strategies and postmortems, and reflect the plan back before recording
it. Obstacle planning remains optional: an explicit empty `obstacle_plans` list
means you chose to skip. Omission is rejected; partial plans return guidance.
A token does not establish that the person gave a particular answer.
Before recording habit progress, tell the agent your timezone and the day boundary
shown in Goals Settings. These preferences are local to your device and must be
supplied explicitly.

## Use the API directly

Set `GOALS_API_URL=https://goalsapp.org` and provide `GOALS_API_TOKEN` through
your local secret mechanism. Start by checking the workflow and reading goals:

```sh
curl --fail-with-body "$GOALS_API_URL/api/v1/workflow" \
  -H "Authorization: Bearer $GOALS_API_TOKEN"

curl --fail-with-body "$GOALS_API_URL/api/v1/visions?limit=50" \
  -H "Authorization: Bearer $GOALS_API_TOKEN"

```

After eliciting and confirming the person’s own wish and outcome, and only when
`writes_allowed` is true, create the agreed vision with a stable unique ID:

```sh
curl --fail-with-body "$GOALS_API_URL/api/v1/visions" \
  -H "Authorization: Bearer $GOALS_API_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"id":"music-vision","title":"Learn to play music","wish_text":"Play guitar","outcome_text":"Make music with friends"}'
```

Creates return `{item}`. Preserve your chosen ID across retries. Reads include a
string `sync_version`; supply that value as `expected_version` when editing:

```sh
curl --fail-with-body -X PATCH "$GOALS_API_URL/api/v1/visions/music-vision" \
  -H "Authorization: Bearer $GOALS_API_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"expected_version":"123","title":"Play music with friends"}'
```

Replace `123` with the actual version from your read. A `version_conflict` 409 means another edit
won: read again and reconsider your change. A `review_required` 409 means the
person must complete their review in Goals and sync; `sync_required` or
`workflow_unavailable` means the current cloud sprint is absent or unreadable. If a request times out, read the same
ID before retrying because it may already have committed. The MCP adapter does
not automatically retry writes. Upstream API response bodies are capped at 4 MiB (MCP results also include
a structured copy); reduce the
page size if a list exceeds that limit.

401 means the token is invalid/expired/revoked; 403 means it lacks the needed
scope; 402 means Sync access is inactive; 503 means the service or connection is
unavailable. Edits appear in the app on its next sync. A later offline app upload
can still replace a row according to the app's existing receive-order policy.

## Troubleshooting and rotation

| Symptom | Action |
| --- | --- |
| Process cannot start | Check Node is version 22 or later and use an absolute executable path. Try the direct Node installation above. |
| Invalid `GOALS_API_TOKEN` | Copy the complete token from Goals Settings without extra characters. |
| `response_too_large` (502) | Reduce the page size. After a write, read the record before retrying. |
| `request_cancelled` (499) | The caller cancelled; read the record before retrying a write. |
| Invalid `GOALS_API_URL` | Supply only the origin, such as `https://goalsapp.org`, without `/api`. |
| 401 | Create a replacement token in Goals, update the client secret, reconnect and verify a read; revoke the old token. |
| 403 | The tool requires write access. Create an appropriately scoped token if the person wants that operation. |
| 402 | Check the account's Sync subscription in Goals. |
| `review_required` | Complete the human review in Goals, then Sync Now. |
| `sync_required` / `workflow_unavailable` | Open Goals and sync a usable current sprint. |
| `version_conflict` | Read the current record and reconsider the change. |
| `incomplete_vision` | Ask for wish/outcome and repair the vision before adding actions. |
| 503, cancellation or unreadable reply | A write may have committed. Read its stable ID before retrying. |
| Changes not visible in Goals | Use Sync Now. Offline uploads follow the app's receive-order conflict policy. |

Tokens created in the app expire after 30 days. Rotate them before expiry using
the sequence above. If a token was exposed, revoke it immediately. Never put
secrets or personal goal text in an issue report; include the release version,
client/platform and redacted error code instead. Reports are welcome at
[goals-mcp issues](https://github.com/tedks/goals-mcp/issues). For security
vulnerabilities, use [private reporting](https://github.com/tedks/goals-mcp/security/advisories/new).

The full contract is in [agent-api.md](agent-api.md). Agent-driven sprint reviews,
hosted OAuth MCP and local-only guest data access are outside this release.

## Verify the public source

From a clone of [goals-mcp](https://github.com/tedks/goals-mcp), with Node.js 22 or later:

```sh
npm ci --ignore-scripts
npm run build
npm test
node tests/package.cjs
```

These checks use synthetic tokens and a local fixture API, including a fresh
installation of the packed archive. The Goals application's own CI additionally
checks the real API against PostgreSQL, account isolation, workflow gates and
app/backend contract conformance.
