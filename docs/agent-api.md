# Agent API and MCP specification

Version: v1. Production origin: `https://goalsapp.org`.

See the [connection guide](agent-setup.md) for token creation, client configuration
and examples. The public MCP source is [tedks/goals-mcp](https://github.com/tedks/goals-mcp).

## Purpose and assumptions

Agents help a person understand their goals, plan concrete actions, and record
progress. The cloud database is the shared source of truth; guest/local data is
available only after the person signs in, subscribes to Sync, and syncs the app.
An agent operates as one account. It cannot select a user ID or manage billing.
Existing app sync remains compatible and retains its receive-order conflict
policy; API preconditions protect API writes, not later offline app uploads.

## Product policy

The agent interfaces preserve the app's human reflection workflow. The server
can enforce state and input requirements; it cannot prove that someone reflected
or that an agent faithfully represented them. Agents must elicit the person's
wish, desired outcome and obstacles, use their words, and never invent those
answers or claim a review happened. A write token delegates recording; it is not
evidence of a particular answer.

GET `/api/v1/workflow` returns current write eligibility, the selected sprint ID
and version, and actionable planning/review prompts. Selection matches the app:
choose the latest-started unreviewed sprint, breaking ties by greatest ID; older
unreviewed duplicates are superseded. A completed review must be synced with its
next sprint. Missing or malformed cloud workflow state fails closed and tells the
person to open Goals and sync. The server clock determines whether the selected
sprint has ended; early completion also requires review. Every data mutation
rechecks this policy inside the account lock shared with sync/import. Reads and
token management remain available. Review completion stays in the human app;
agents cannot clear the gate, manufacture a replacement sprint, or bypass it by
archiving an action or recording an old habit day. Offline changes become visible
to this gate when synced; the API cannot inspect an unsynced device.

Visions require nonblank, trimmed wish and outcome text. Patches cannot blank
those fields; editing a legacy incomplete vision must repair it, and adding or
moving an action to one is rejected with `incomplete_vision`. Creating a task/habit requires an explicit `obstacle_plans` list:
ask what could prevent this action and what response the person wants to try.
An empty list is allowed when the person chooses to skip; missing fields are not
silently defaulted to a skip. Partial plans remain allowed as in the app and
produce guidance to fill the missing part. Existing strategies and postmortems
are readable context to discuss, never replacements for the person's answer.
Planning guidance accompanies action reads and writes, including explicit skips.

Current/unreviewed sprint end times and sampled lengths are withheld from agent
reads, preserving the app's hidden-end design. Completed sprint history remains
available for reflection. Prediction prompts are optional and dismissible on a
device; the cloud API does not invent a hard prediction gate from missing local
preferences.

## Access

A signed-in, registered person manages personal access tokens in Settings.
`/api/agent-tokens` uses Firebase authentication only. POST creates a named token
with `goals:read` and optionally `goals:write`, valid for 1–90 days (default 30).
The secret is shown once. Only its SHA-256 digest is stored. At most 20 unrevoked,
unexpired tokens may exist per account. GET lists metadata; DELETE /:id revokes.
Listing/revocation remain available without a Sync subscription.

`/api/v1` accepts these tokens in `Authorization: Bearer ...`. Every data request
requires a current Sync entitlement. Tokens cannot call legacy sync/import,
Firebase-authenticated account routes, or mint further tokens. A revoked/expired
secret returns 401; insufficient scope 403; missing subscription 402; unavailable
auth/entitlement storage 503. Responses are `Cache-Control: no-store`.

## Data contract

GET `/api/v1/schema` describes the supported write inputs as JSON Schema.
GET `/api/v1/:collection` lists account-owned records in ascending ID order,
with `limit` (default 50, maximum 100), optional `after` (last ID), and optional
`include_archived=true` for visions/actions. The envelope is `{items, next_cursor}`.
Pages are live reads, not a frozen snapshot; re-list if concurrent changes matter.
GET `/api/v1/:collection/:id` returns `{item}` or 404, including for another
account's record. Collections: visions, actions, sprints, adaptations,
metric_templates, metric_values, sprint_predictions, postmortems.
Fields follow the [snake_case data schema](../GOALS_DATA_SCHEMA.json) (with the sprint timing
redactions described above and computed `planning_guidance` on actions), with `sync_version` as an
opaque decimal string. Internal account identifiers are never returned.

POST `/api/v1/visions` and `/api/v1/actions` create records with a caller-chosen
ID (1–128 URL-safe characters). A duplicate ID returns 409 without modifying any
record. Preserve the ID across retries; after an uncertain response GET that ID
to determine whether creation committed. Creation returns 201 `{item}`.

PATCH `/api/v1/visions/:id` edits title, wish_text, outcome_text.
PATCH `/api/v1/actions/:id` edits title, notes, primary_vision_id, obstacle/plan
pairs, and type-specific fields: task due/effort/blocked_by/status (open/done) or
habit recurrence. Both types accept `archived: true|false`, independently of task
completion status, matching the app's archive/restore behavior. Type cannot
change. Omitted fields remain unchanged.
Every edit requires `expected_version` from the last read; a mismatch returns
409 `version_conflict`. Read again and reconsider the edit before retrying.
IDs, timestamps, provenance, legacy weight fields and completion arrays are
server controlled. Unknown input fields are rejected. Task effort stays on the
app's 1–5 scale. Dependencies must be same-account tasks and acyclic. Completing
a blocked task is rejected; reopening a task may block its dependents again.

PUT `/api/v1/actions/:id/check-ins/:day` sets an explicit habit day complete or
incomplete using `{expected_version, completed, timezone, day_boundary_time}`.
`day` is YYYY-MM-DD; `timezone` is the person's IANA zone and `day_boundary_time`
is their HH:MM setting. These preferences are device-local, so the caller must
confirm them with the person instead of trusting stale cloud settings. The server
subtracts elapsed boundary minutes before computing the local date (matching the
app, including DST), rejects future days, and preserves all other days. Legacy timestamp
entries are interpreted in that zone. New entries carry server `recorded_at`,
`source: backfill`, and `occurred_at: null`; an agent never invents an occurrence
instant. Reasserting an unchanged day is a no-op. Archived habits reject check-ins.

Validation failures return 400 `{error, message}`; domain conflicts return 409;
missing records 404. Unexpected failures return a generic 503 without secrets or
SQL. Writes take the same per-account transaction lock as sync/import, validate
against current records, and use existing version triggers. No hard-delete API
is exposed. Sprint reviews, adaptations and derived metrics are read-only in v1.

## MCP

A local stdio MCP process talks exclusively to the hosted API using
`GOALS_API_URL` and `GOALS_API_TOKEN`. Use the official TypeScript SDK for protocol
negotiation, discovery, validation and tool dispatch. The process writes only MCP
messages to stdout; diagnostics go to stderr. HTTPS is required except for
loopback development. Redirects are rejected so credentials cannot be forwarded.
Requests have a timeout and are never automatically retried after an uncertain
write. Tool failures are MCP `isError` results carrying actionable API errors.

Tools cover list/get, create/update vision, create/update action and set habit
check-in. Inputs mirror the API and write tools require explicit record IDs and
versions. Read-only, destructive and idempotent annotations describe each tool.
The API schema is available through an MCP resource, together with usage guidance.

Remote MCP hosting with browser OAuth, agent-driven sprint review, hard deletion,
and local-only data access are separate future capabilities. This release does
not claim support for those workflows.

## Verification and versioning

The API and MCP share input-contract source. CI checks malformed inputs, account
isolation, expiry/revocation/scopes, entitlement failures, stale writes, dependency
cycles, day boundaries, cancellation and sync visibility. PostgreSQL integration
checks exercise actual API transactions and workflow gates. The public release
checks install the archive into a fresh directory and use an official MCP client.

The `/api/v1` prefix identifies the API contract. MCP releases are pinned and
versioned independently; see the public release's changelog before upgrading.
Read `/api/v1/schema` for the deployed write inputs. Errors may include a
`context` object (for example, current workflow status); preserve it when giving
the person recovery instructions. Unknown fields in writes are rejected.

Protocol references:
- https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- https://ts.sdk.modelcontextprotocol.io/server
