# Start issue

Carry each Linear ticket through implementation, validation and review. For research and plan publication without implementation, use `/plan` (or read `.cursor/commands/plan.md`). For reviewing a plan or issue without implementing, use `/review-plan` (or read `.cursor/commands/review-plan.md`).

## Before starting

Do this before writing any code, and always before starting an epic or its first sub-issue.

1. Read the Linear ticket: description, acceptance criteria, comments, dependencies and linked documents.
2. If it has a parent, read the parent epic. If it is an epic, read every sub-issue and its order and dependencies.
3. Explore Notion docs when they exist: pages linked from the ticket or epic, and the relevant domain pages under the Notion page titled “Talvio” (see “Documentation organization”). If no Notion docs exist, say so and continue.
4. Read the repository instructions (`AGENTS.md`) and inspect the current implementation.
5. Resolve differences between the ticket, the docs and the code. Do not assume older documentation describes current behavior. Ask only when a material ambiguity cannot be resolved from available evidence.
6. Move the ticket to **In Progress** when implementation begins. Do not change **Done**, **Canceled** or **Duplicate** tickets without an explicit request.

## Local or cloud

- **Local**: you run in the user's editor. Leave changes uncommitted for review. Never stage, commit, amend, push or merge unless explicitly instructed. The user creates the commit. Preserve existing user changes and keep them separate from your own.
- **Cloud**: you run as a cloud or background agent in a remote environment. Follow “Branches and pull requests”.

## Branches and pull requests

Cloud runs:

- An epic has one feature branch, cut from `development`. Reuse it if it exists; create and push it from `development` if it does not.
- Each sub-issue gets its own branch, cut from the epic's feature branch.
- Commit and push the sub-issue branch, then open a pull request into the epic's feature branch, not into `development` or `main`.
- Never merge pull requests yourself. The user merges them.
- Wait for the sub-issue PR to be merged into the feature branch before starting the next sub-issue. When a run starts, check that the previous sub-issue's PR is merged; if it is not, stop and report it.
- Start the next sub-issue from the updated feature branch so it includes the merged work.
- When every sub-issue is merged into the feature branch, the user opens and merges the feature branch into `development`.
- A ticket counts as done only when the feature branch that contains it is merged into `development`.

Local runs use one feature branch for the epic and its children. Do not create a branch per sub-issue.

## Traceability

- Include the Linear identifier in every branch name and commit message whenever you control them.
- Examples:
  - Epic feature branch: `cursor/mdi-200-resume-export`
  - Sub-issue branch: `cursor/mdi-211-llm-operation-contracts`
  - Commit subject: `feat(llm): add versioned operation contracts`
  - Commit footer: `Refs: MDI-211`
- If a platform adds its own prefix or suffix, keep the identifier in the descriptive segment: `cursor/mdi-211-llm-operation-contracts-5d6d`.
- Follow Conventional Commits (`<type>(<scope>): <description>`). Put the Linear identifier only in a `Refs:` footer, never in the subject.
- Include the identifier in the pull request title and link the ticket in its description.
- If no ticket was supplied, search Linear for a match. Do not invent an identifier or attach unrelated work to a ticket.

## Implementation and validation

- Implement the ticket's scope and acceptance criteria while preserving existing behavior outside that scope.
- Run relevant tests and required repository checks.
- Document material limitations, unresolved dependencies and any acceptance criteria that remain unmet.
- Do not claim a check passed unless you ran it and observed success.

## Linear progress

Team statuses: Backlog, Todo, In Progress, In Review, Done, Canceled, Duplicate. There is no Blocked status.

- Keep the ticket status aligned with actual progress.
- Add concise updates at meaningful milestones, when scope changes, or when a blocker appears. Avoid comments for every minor action.
- If blocked, describe the blocker, its impact and the action needed. Stay **In Progress** and record the blocker.
- When a status is unavailable, use the closest existing team status. Do not create a new one.
- Never infer completion from an unrelated commit or merge.

Cloud:

- After opening the sub-issue PR, move the ticket to **In Review** and add the PR link, branch, validation results and any limitations.
- Address review findings on the same sub-issue branch.
- When the sub-issue PR is merged into the feature branch, add a comment saying so. Keep the ticket **In Review**.
- When the feature branch is merged into `development` and the acceptance criteria are satisfied, move the epic and every sub-issue merged with it to **Done**.

Local:

- When implementation, validation and documentation are ready, add a concise “Ready for local review — uncommitted” update. Keep the ticket **In Progress**.
- After the user confirms they committed the work, or asks you to check, verify the commit, record its hash and move the ticket to **In Review**.
- Move the ticket to **Done** only with explicit user confirmation.

## Notion documentation

After the work is ready for review, check whether the relevant Talvio documentation is missing, stale or affected by the change.

- Update an existing domain page when possible. Create a new child page under Talvio only when the topic needs its own scope.
- Document the resulting behavior and architecture, not a chronological account of implementation.
- Clearly distinguish proposed designs, changes merged into a feature branch but not yet into `development`, and behavior merged into `development`.
- Link the Linear ticket and pull request. For documentation written before the feature branch reaches `development`, label it “Implemented in PR — pending merge to development”.
- Preserve unrelated content and established decisions. Explain material changes to previous decisions.
- If documentation is already accurate and the change needs no update, say so in the review handoff.

## Documentation organization

This is the authoritative domain list for Talvio Notion pages. Other commands should link here instead of restating it.

- Use the Talvio parent page as a concise index.
- Organize child pages by domain:
  - Account and onboarding
  - Resume editing and PDF generation
  - LLM orchestration
  - Data and authentication
  - Media and email
  - Infrastructure and deployment
- Give each page a clear purpose and boundary. Split large pages into focused subpages when needed.
- Use consistent sections where relevant: purpose, current behavior, architecture, contracts, operational guidance, limitations and related links.
- Maintain one authoritative location for each topic; link to it instead of duplicating content.
- Keep historical decisions clearly labeled and separate from current instructions.

## Review handoff

Before handing the task back:

- Summarize the change, validation, documentation links and remaining limitations.
- Confirm affected Notion documentation is updated or explain why no update was needed.

Cloud:

- Confirm the sub-issue branch is pushed and its PR targets the epic's feature branch and accurately describes the final change.
- Confirm Linear is **In Review** with the PR link.
- Stop and wait for the PR to be merged into the feature branch.

Local:

- Leave changes uncommitted on the correct feature branch.
- Confirm Linear records “Ready for local review — uncommitted” while remaining **In Progress**.
- Stop and wait for the user's review.

If Linear or Notion is unavailable, continue work that does not depend on it. Report the access problem and the exact status or documentation updates still outstanding. Never claim an external update succeeded without verifying it.

## Parent issues and sub-issues

- When assigned a parent issue or epic, inspect its sub-issues and dependencies, then implement only one sub-issue at a time.
- Start with the first unblocked sub-issue in the intended order, unless the user specifies another.
- Complete that sub-issue through validation, the required Linear and Notion updates, and either a PR into the feature branch (cloud) or an uncommitted local handoff (local).
- Then stop and wait for review. Do not begin another sub-issue, even if it is unblocked.
- Continue to the next sub-issue only when the user explicitly asks, and in the cloud only after the previous sub-issue's PR is merged into the feature branch. Approval alone is not authorization to continue.
- Keep the parent **In Progress** while implementation remains. In the cloud, move it to **In Review** once every sub-issue is merged into the feature branch, and to **Done** when the feature branch is merged into `development`.
