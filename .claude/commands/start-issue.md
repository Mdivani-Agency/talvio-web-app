---
description: Start working on linear task
argument-hint: [Linear Ticket Number]
---

explore and start working on $ARGUMENTS

## Before starting

Do this before writing any code, and always before starting an epic or its first sub-issue.

1. Read Linear ticket $ARGUMENTS: description, acceptance criteria, comments, dependencies, and linked documents.
2. If it has a parent, read the parent epic. If it is an epic, read every sub-issue and its order and dependencies.
3. Explore Notion docs when they exist: pages linked from the ticket or epic, and the relevant domain pages under the Notion page titled “Talvio”. If no Notion docs exist, say so and continue.
4. Read the repository instructions (`AGENTS.md`) and inspect the current implementation.
5. Resolve differences between the ticket, the docs, and the code. Do not assume older docs describe current behaviour. Ask only when a material ambiguity cannot be resolved from the evidence.

## Local or cloud

- **Local**: you run in the user's editor. Follow “Local workflow and ownership”.
- **Cloud**: you run as a cloud or background agent in a remote environment. Follow “Cloud workflow and branches”.

## Local workflow and ownership

- Use one local feature branch for the assigned feature or epic.
- Reuse the appropriate existing branch; do not create one per sub-issue.
- Implement, validate, and document changes, then leave them uncommitted for review.
- Never stage, commit, amend, push, or merge changes unless explicitly instructed.
- The user decides when the work is ready and creates the commit.
- Preserve existing user changes and distinguish them from changes made for the current task.

## Cloud workflow and branches

- An epic has one feature branch, cut from `development`, for example `cursor/mdi-200-resume-export`. Reuse it if it exists; create and push it from `development` if it does not.
- Each sub-issue gets its own branch, cut from the epic's feature branch, for example `cursor/mdi-211-llm-operation-contracts`.
- Commit and push the sub-issue branch, then open a pull request into the epic's feature branch, not into `development` or `main`.
- Follow the commit message rules in `AGENTS.md`. Put the Linear identifier in a `Refs:` footer, not in the subject. Include it in the PR title and link the ticket in the PR description.
- Never merge pull requests yourself. The user merges them.
- Wait for the sub-issue PR to be merged into the feature branch before starting the next sub-issue. When a run starts, check that the previous sub-issue's PR is merged; if it is not, stop and report it.
- Start the next sub-issue from the updated feature branch so it includes the merged work.
- When every sub-issue is merged into the feature branch, the user opens and merges the feature branch into `development`.
- A ticket counts as done only when the feature branch that contains it is merged into `development`.

## Linear progress

- Move the ticket to In Progress when implementation begins.
- If blocked, keep the ticket In Progress and record the blocker and required action.
- Move a ticket to Done only when its completion condition is met (below). Never infer completion from an unrelated commit.

Local:

- Once implementation, validation, and documentation are ready, add a concise “Ready for local review — uncommitted” update. Keep the ticket In Progress.
- Include the feature branch, change summary, validation results, documentation links, and any limitations.
- Address review findings without committing.
- After the user confirms they committed the completed work, or explicitly asks you to check, verify the relevant commit and move the ticket to In Review.
- Record the commit hash in Linear.
- Move a ticket to Done only with explicit user confirmation.

Cloud:

- After opening the sub-issue PR, move the ticket to In Review and add the PR link, branch, validation results, and any limitations.
- Address review findings on the same sub-issue branch.
- When the sub-issue PR is merged into the feature branch, add a comment saying so. Keep the ticket In Review.
- When the feature branch is merged into `development`, move the epic and every sub-issue merged with it to Done.

## Parent issues and sub-issues

- Implement only one sub-issue at a time, starting with the first eligible child unless directed otherwise.
- Begin another child only when explicitly instructed, and in the cloud only after the previous child's PR is merged into the feature branch. Do not treat a review request or acceptance as authorization to start the next issue.
- A prerequisite child's work may be used by dependent work once it is committed (local) or merged into the feature branch (cloud).
- Keep deployment, external-action, and explicit-acceptance dependencies blocking until their conditions are satisfied.
- Keep the parent In Progress while implementation remains.

Local:

- Use one feature branch for the parent and its children.
- Complete implementation, validation, and documentation, then stop for local review with changes uncommitted.
- Continue addressing that child's review findings until the user accepts the work. The user creates the commit for the child.
- Move the parent to In Review once all required child work is committed and validated together. Mark it Done only with explicit user confirmation.

Cloud:

- Use one branch per child, each with its PR into the epic's feature branch.
- Move the parent to In Review once every child is merged into the feature branch. It becomes Done when the feature branch is merged into `development`.

## Review handoff

Before handing the task back:

- Summarize the implementation and identify the affected files.
- Report validation results, unrun checks, and material limitations.
- Confirm affected repository and Notion documentation is updated, or explain why no update was needed.

Local:

- Leave changes uncommitted on the correct feature branch.
- Confirm Linear records “Ready for local review — uncommitted” while remaining In Progress.
- Stop and wait for the user's review.

Cloud:

- Confirm the sub-issue branch is pushed and its PR targets the epic's feature branch.
- Confirm Linear is In Review with the PR link.
- Stop and wait for the PR to be merged into the feature branch.
