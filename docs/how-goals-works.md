# How Goals helps you follow through

Goals is a task-tracking system informed by cognitive and motivational psychology.
Its purpose is to help you accomplish goals you value, using human planning,
reflection and reinforcement. Your goals and your real-world progress matter;
checkmarks are records of that work.

## WOOP: turn a wish into a response you can use

Goals uses **WOOP**, a practical form of mental contrasting with implementation
intentions. It connects an imagined future to the obstacle in the way and a
specific response:

1. **Wish:** choose something meaningful, challenging and feasible.
2. **Outcome:** take a moment to vividly imagine the best result of achieving it.
3. **Obstacle:** identify a likely internal obstacle, such as a feeling, habit or
   belief. External constraints still matter; acknowledging them is not a reason
   to blame yourself.
4. **Plan:** decide what you will do when that obstacle appears: “If I notice X,
   then I will do Y.” Make the response concrete enough to try.

This is a reflection exercise, not just four fields to fill. Give yourself time
to imagine the outcome and obstacle. The [official WOOP practice](https://woopmylife.org/en/practice)
walks through the process. A [2021 meta-analysis](https://doi.org/10.3389/fpsyg.2021.565202)
found a small-to-moderate average benefit for goal attainment, with effects
varying across studies and possible publication bias. That supports the method;
it does not establish the effectiveness of every feature in Goals.

## The WOOP rhythm in Goals

| When | What you do |
| --- | --- |
| Create or revisit a goal | Describe your wish and desired outcome. Reconsider whether you still want it and whether it is feasible. |
| Plan a task or habit | Imagine the sprint ending with the action undone. Identify what might get in the way and pair it with an if-then response. Obstacle planning is optional; you can choose to skip or return to a partial plan. |
| Do the work | Use the response when its cue appears. Record task or habit completion when the work actually happened. |
| Review a sprint | Reflect on what worked and what got in the way. Revisit unfinished actions, strategies and lessons from unfinished work. If you made an optional follow-through estimate, compare it with what happened. |
| Begin the next sprint | Carry the learning into your next plans. Adjust an unhelpful strategy or reconsider a goal, rather than treating a setback as a personal failure. |

Reviews are part of the work. When one becomes due, finish it in Goals before
continuing ordinary edits through the API. An agent can discuss the prompts and
help you express your answers, but the reflection and review belong to you.

## Why sprint endings are hidden

Goals intentionally hides the active sprint's ending for two reasons.

First, a visible countdown invites cramming: “I can do that just before the
sprint ends.” With no displayed ending to plan around, the design encourages
steady action. When the sprint ends, review is due immediately.

Second, **sprint completion is intended as an uncertain reward**. Completing a
real task or habit is the action—the “lever pull”—and discovering that a sprint
has ended is the rewarding outcome. The scheduled boundary is hidden; qualifying
work can also trigger a deterministic early completion, so uncertainty does not
apply to every way a sprint can end. The designer's
variable-reinforcement or “Skinner box” analogy is the unpredictable reward that
also makes slot machines compelling. The intention is to make returning to
productive action rewarding.

The current app samples a hidden sprint duration in advance and also has a
separate early-completion rule. It does **not** draw a new random outcome on each
habit check-in. This is a design analogy, not a claim that Goals implements a
slot machine's exact reward schedule or has been shown to cause addiction.
[Research on uncertain rewards](https://doi.org/10.1086/679418) has found increased
effort under some conditions, and [a simulated slot-machine study](https://doi.org/10.3389/fpsyg.2016.00046)
examined how payoff and timing affect persistence. Neither study tested Goals.

Do not try to reverse-engineer the current ending or record false completions to
chase a sprint reward. Use the hidden boundary to focus on the work you chose.

## Working with an agent, with or without Sync

Both routes use the same public [agent priming](https://github.com/tedks/goals-mcp/blob/master/docs/AGENTS.md):
ask for your own wish, outcome and obstacle; leave room to reflect; confirm a plan
before recording it; and respect the sprint review. An agent should never invent
your answers or treat access to your account as approval of a particular change.

| Your setup | How an agent can help |
| --- | --- |
| Paid, active Sync | The API and MCP server can read your cloud-synced records and make authorized changes. Follow the [connection guide](agent-setup.md). |
| Local-only Goals, including non-paying users | Use a computer-use agent in the existing Goals app on your device. No Goals API token or Sync subscription is required for this route. |

Local-only data stays on your device; there is no remote dataset for the Goals
API to read. A computer-use agent must work in the device/browser profile that
contains your data. Computer-use capability comes from your chosen agent client;
Goals does not provide or require a particular one. The documentation and agent
priming are public and require no account, token or subscription.

You can give a computer-use agent this starting instruction:

> Read https://github.com/tedks/goals-mcp/blob/master/docs/AGENTS.md. I use Goals
> locally. Help me through the visible app on this device. Ask one question at a
> time and use my answers. Let me do the reflection and complete sprint reviews.
> Confirm changes with me, record only real progress, and keep the active sprint
> ending hidden. Do not use the API or upload my data to enable it.

For habit progress, confirm the day, timezone and day boundary shown in your
Goals Settings. These preferences are local to the device, including when you
use the API. If paid Sync becomes inactive, computer use remains an option with
the same priming and the data available in your app.
