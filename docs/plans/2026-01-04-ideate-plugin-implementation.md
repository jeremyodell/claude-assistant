# Ideate Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code plugin that transforms ideas into validated, dependency-mapped Linear stories through a five-phase workflow.

**Architecture:** Command-based plugin following team-workflow patterns. Seven slash commands orchestrate the workflow, with a skill for activation triggers. File-based artifacts enable resumability between phases.

**Tech Stack:** Markdown commands, YAML frontmatter for skill, Linear MCP for issue management, integrates with superpowers and frontend-designer plugins.

---

## Task 1: Plugin Scaffold

**Files:**
- Create: `plugins/ideate/.claude-plugin/plugin.json`
- Create: `plugins/ideate/.mcp.json`

**Step 1: Create plugin directory structure**

```bash
mkdir -p plugins/ideate/.claude-plugin
mkdir -p plugins/ideate/commands
mkdir -p plugins/ideate/skills/ideate
```

**Step 2: Create plugin.json manifest**

Create `plugins/ideate/.claude-plugin/plugin.json`:

```json
{
  "name": "ideate",
  "version": "1.0.0",
  "description": "Transform ideas into validated, dependency-mapped Linear stories through brainstorming, pressure testing, planning, and story creation",
  "author": {
    "name": "Jeremy Odell"
  },
  "license": "MIT",
  "keywords": [
    "ideation",
    "brainstorm",
    "planning",
    "linear",
    "stories",
    "dependencies"
  ]
}
```

**Step 3: Create MCP configuration**

Create `plugins/ideate/.mcp.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
    }
  }
}
```

**Step 4: Verify structure**

```bash
ls -la plugins/ideate/
ls -la plugins/ideate/.claude-plugin/
cat plugins/ideate/.claude-plugin/plugin.json | head -5
```

Expected: Directories exist, plugin.json shows name "ideate"

**Step 5: Commit**

```bash
git add plugins/ideate/
git commit -m "feat(ideate): scaffold plugin structure

- Add plugin.json manifest
- Add .mcp.json for Linear integration
- Create directory structure for commands and skills"
```

---

## Task 2: Setup Command

**Files:**
- Create: `plugins/ideate/commands/setup.md`

**Step 1: Create setup command**

Create `plugins/ideate/commands/setup.md`:

```markdown
# /ideate:setup

Configure ideate plugin defaults for this project.

## Process

### Step 1: Check for existing config

```bash
if [ -f ".claude/ideate.local.md" ]; then
  echo "Config exists"
fi
```

If config exists, show current settings and ask: "Update configuration? [y/N]"

### Step 2: Fetch Linear teams

```
mcp__linear__list_teams()
```

Present teams as numbered list. User selects team.

### Step 3: Fetch projects for selected team

```
mcp__linear__list_projects(team: "$SELECTED_TEAM")
```

Present projects as numbered list. User selects project.

### Step 4: Configure default labels

Ask: "Default labels to add to all stories? (comma-separated, or 'none')"

Suggested: `from-ideate`

### Step 5: Write config file

Create `.claude/ideate.local.md`:

```markdown
---
linear_team: "$SELECTED_TEAM"
linear_project: "$SELECTED_PROJECT"
default_labels:
  - "from-ideate"
frontend_designer_plugin: "frontend-designer"
---

# Ideate Plugin Configuration

Project-specific settings for the ideate workflow.
```

### Step 6: Confirm setup

```
✅ Ideate configured for this project

Team: $TEAM_NAME
Project: $PROJECT_NAME
Labels: from-ideate

Run /ideate "your idea" to start.
```

## Error Handling

| Error | Action |
|-------|--------|
| Linear MCP not connected | Error: "Linear MCP required. Check your MCP configuration." |
| No teams found | Error: "No Linear teams found. Check your Linear permissions." |
| No projects in team | Warn, allow continuing without project default |
```

**Step 2: Verify command syntax**

```bash
head -20 plugins/ideate/commands/setup.md
```

Expected: Shows markdown command header and first process step

**Step 3: Commit**

```bash
git add plugins/ideate/commands/setup.md
git commit -m "feat(ideate): add setup command

- Fetches Linear teams and projects via MCP
- Writes configuration to .claude/ideate.local.md
- Configures default labels"
```

---

## Task 3: Brainstorm Command

**Files:**
- Create: `plugins/ideate/commands/brainstorm.md`

**Step 1: Create brainstorm command**

Create `plugins/ideate/commands/brainstorm.md`:

```markdown
# /ideate:brainstorm $IDEA

Flesh out an idea through collaborative brainstorming, then gather project-specific details.

## Arguments

- `$IDEA`: The idea to brainstorm (required)

## Process

### Step 1: Create feature directory

```bash
SLUG=$(echo "$IDEA" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g' | cut -c1-50)
DATE=$(date +%Y-%m-%d)
FEATURE_DIR="docs/features/${DATE}-${SLUG}"
mkdir -p "$FEATURE_DIR"
```

Save `$FEATURE_DIR` for subsequent phases.

### Step 2: Invoke superpowers:brainstorming

```
Invoke the superpowers:brainstorming skill with the user's idea.
Let it run its full interactive Q&A process.
```

When brainstorming completes, capture the design output.

### Step 3: Save design artifact

Write the brainstorm output to `$FEATURE_DIR/design.md`:

```markdown
# Design: $IDEA

**Date:** $DATE
**Original idea:** $IDEA

## Design

[Captured output from superpowers:brainstorming]
```

### Step 4: Post-brainstorm questions

**Question 1: UI Components**

Ask: "Does this feature have UI components?"

- If **Yes**:
  - Check if `frontend-designer` plugin is available
  - If not available:
    ```
    ❌ ERROR: frontend-designer plugin required for UI features.
    Install with: /install frontend-designer

    Workflow halted.
    ```
  - If available:
    - Invoke `frontend-designer` plugin
    - Save output to `$FEATURE_DIR/ui/`

- If **No**: Continue to next question

**Question 2: Linear configuration**

Load config from `.claude/ideate.local.md`

If config exists:
  Ask: "Upload to **$TEAM / $PROJECT**? [Y/n or specify different]"

If no config:
  Run `/ideate:setup` first, then continue.

Store confirmed team/project for upload phase.

### Step 5: Announce completion

```
✅ Brainstorm Complete

Design saved to: $FEATURE_DIR/design.md
UI artifacts: [Yes/No]
Target: $TEAM / $PROJECT

Next: Run /ideate:pressure-test to validate the design.
```

## Resumability

If `$FEATURE_DIR/design.md` already exists:

Ask: "design.md already exists. Overwrite? [y/N]"

- If Yes: Proceed with new brainstorm
- If No: Skip to post-brainstorm questions using existing design

## Error Handling

| Error | Action |
|-------|--------|
| superpowers plugin missing | Error with install instructions, halt |
| frontend-designer missing (UI needed) | Error with install instructions, halt |
| User abandons | Partial artifacts saved for resume |
```

**Step 2: Verify command structure**

```bash
grep -n "^##" plugins/ideate/commands/brainstorm.md
```

Expected: Shows section headers (Arguments, Process, Resumability, Error Handling)

**Step 3: Commit**

```bash
git add plugins/ideate/commands/brainstorm.md
git commit -m "feat(ideate): add brainstorm command

- Invokes superpowers:brainstorming skill
- Creates feature directory with date-slug naming
- Handles UI detection with frontend-designer requirement
- Saves design.md artifact"
```

---

## Task 4: Pressure Test Command

**Files:**
- Create: `plugins/ideate/commands/pressure-test.md`

**Step 1: Create pressure-test command**

Create `plugins/ideate/commands/pressure-test.md`:

```markdown
# /ideate:pressure-test

Validate a design through mandatory pressure testing before planning.

## Prerequisites

Requires `design.md` in the current feature directory.

If not found:
```
❌ ERROR: No design found.
Run /ideate:brainstorm "your idea" first.
```

## Process

### Step 1: Load design and original idea

Read `$FEATURE_DIR/design.md`
Extract the original idea from the file header.

### Step 2: Scope Drift Check

Compare the design back to the original idea.

```
## Scope Drift Check

Original idea: "$ORIGINAL_IDEA"

The design includes:
```

For each major component/feature in the design:
- Mark with ✓ if it directly solves the original problem
- Mark with ? if connection is unclear
- Mark with ✗ if it doesn't trace to original problem

```
✓ [Component] → directly addresses original problem
? [Component] → connection unclear - justify or remove
✗ [Component] → scope creep - remove or defer
```

For each ? or ✗ item, ask user to justify or confirm removal.

Capture responses.

### Step 3: Assumption Challenge

Extract 3-5 key assumptions from the design.

For each assumption:
```
Assumption: "[Extracted assumption]"
Challenge: [Why might this be wrong? What's the alternative?]

Your response:
```

Capture user responses.

### Step 4: Risk Identification

Surface potential risks:

```
## Risks Identified

| Risk | Severity | Mitigation |
|------|----------|------------|
| [Technical risk] | High/Med/Low | [User input] |
| [External dependency] | High/Med/Low | [User input] |
| [Unknown area] | High/Med/Low | [User input] |
```

Ask user to acknowledge each risk or provide mitigation.

### Step 5: YAGNI Check

List features/complexity from the design:

```
## YAGNI Check

Is each item essential for v1, or can it be deferred?

1. [Feature/complexity] → Essential / Defer
2. [Feature/complexity] → Essential / Defer
3. [Feature/complexity] → Essential / Defer
```

Present as multiple choice. Deferred items are logged but removed from scope.

### Step 6: Edge Cases

Prompt for failure modes:

```
## Edge Cases

Consider these failure scenarios:

1. What happens if [relevant failure mode]?
2. What happens if [performance edge case]?
3. What happens if [partial deployment]?

Your responses:
```

Capture responses.

### Step 7: Sign-off

```
## Sign-off Required

The design:
- Solves the original problem: "$ORIGINAL_IDEA"
- Has [N] acknowledged risks with mitigations
- Deferred [M] items to future versions
- Addresses [K] edge cases

Do you confirm this design is validated and ready for planning? [y/N]
```

If No: Ask what needs to change, return to relevant step.
If Yes: Proceed to save.

### Step 8: Save pressure test artifact

Write to `$FEATURE_DIR/pressure-test.md`:

```markdown
# Pressure Test: $FEATURE_NAME

**Date:** $DATE
**Sign-off:** Confirmed
**Timestamp:** $TIMESTAMP

## Original Idea
$ORIGINAL_IDEA

## Scope Drift Check
[Captured decisions]

## Assumptions Challenged
[Captured responses]

## Risks & Mitigations
[Risk table with mitigations]

## YAGNI Decisions
- Essential: [list]
- Deferred: [list]

## Edge Cases
[Captured responses]
```

### Step 9: Announce completion

```
✅ Pressure Test Complete

Validated design saved to: $FEATURE_DIR/pressure-test.md
- Scope drift: Resolved
- Assumptions: [N] challenged
- Risks: [N] with mitigations
- Deferred: [N] items
- Edge cases: [N] addressed

Next: Run /ideate:plan to create implementation plan.
```

## Error Handling

| Error | Action |
|-------|--------|
| design.md not found | Error: Run /ideate:brainstorm first |
| User rejects sign-off | Return to relevant step for revision |
| User abandons | Partial progress lost (no artifact until sign-off) |
```

**Step 2: Verify command structure**

```bash
wc -l plugins/ideate/commands/pressure-test.md
grep "Step [0-9]:" plugins/ideate/commands/pressure-test.md
```

Expected: ~150+ lines, shows all 9 steps

**Step 3: Commit**

```bash
git add plugins/ideate/commands/pressure-test.md
git commit -m "feat(ideate): add pressure-test command

- Mandatory validation checkpoint before planning
- 6-step process: scope drift, assumptions, risks, YAGNI, edge cases, sign-off
- Requires explicit user sign-off to proceed"
```

---

## Task 5: Plan Command

**Files:**
- Create: `plugins/ideate/commands/plan.md`

**Step 1: Create plan command**

Create `plugins/ideate/commands/plan.md`:

```markdown
# /ideate:plan

Create a detailed implementation plan from a validated design.

## Prerequisites

Requires `pressure-test.md` with sign-off in the current feature directory.

If not found:
```
❌ ERROR: No validated design found.
Run /ideate:pressure-test first.
```

If found but no sign-off:
```
❌ ERROR: Design not signed off.
Complete /ideate:pressure-test with sign-off first.
```

## Process

### Step 1: Load validated design

Read `$FEATURE_DIR/design.md` and `$FEATURE_DIR/pressure-test.md`

Extract:
- Feature description
- Essential scope (post-YAGNI)
- Technical approach
- Edge cases to handle

### Step 2: Invoke superpowers:writing-plans

```
Invoke the superpowers:writing-plans skill.
Provide it with the validated design context.
Let it create a detailed implementation plan.
```

### Step 3: Save plan artifact

Write the plan output to `$FEATURE_DIR/plan.md`:

```markdown
# Implementation Plan: $FEATURE_NAME

**Date:** $DATE
**Based on:** design.md (validated via pressure-test.md)

[Captured output from superpowers:writing-plans]
```

### Step 4: Announce completion

```
✅ Plan Complete

Implementation plan saved to: $FEATURE_DIR/plan.md

Next: Run /ideate:stories to break into Linear stories.
```

## Resumability

If `$FEATURE_DIR/plan.md` already exists:

Ask: "plan.md already exists. Overwrite? [y/N]"

## Error Handling

| Error | Action |
|-------|--------|
| pressure-test.md not found | Error: Run /ideate:pressure-test first |
| No sign-off in pressure-test | Error: Complete pressure test with sign-off |
| superpowers plugin missing | Error with install instructions, halt |
```

**Step 2: Verify command**

```bash
head -30 plugins/ideate/commands/plan.md
```

Expected: Shows prerequisites and first process steps

**Step 3: Commit**

```bash
git add plugins/ideate/commands/plan.md
git commit -m "feat(ideate): add plan command

- Requires validated design with sign-off
- Invokes superpowers:writing-plans skill
- Saves plan.md artifact"
```

---

## Task 6: Stories Command

**Files:**
- Create: `plugins/ideate/commands/stories.md`

**Step 1: Create stories command**

Create `plugins/ideate/commands/stories.md`:

```markdown
# /ideate:stories

Decompose an implementation plan into dependency-mapped Linear stories.

## Prerequisites

Requires `plan.md` in the current feature directory.

If not found:
```
❌ ERROR: No implementation plan found.
Run /ideate:plan first.
```

## Process

### Step 1: Load plan

Read `$FEATURE_DIR/plan.md`
Read `$FEATURE_DIR/design.md` for context.

### Step 2: Decompose into stories

Analyze the plan and create stories. For each logical unit of work:

```markdown
## Story N: [Title]

### Summary
[One-line description]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Notes
[Implementation guidance from plan]

### Test Approach
[How to verify - from plan's test steps]

### Dependencies
- Blocked by: [Story title(s) or "None"]
- Blocks: [Story title(s) or "None"]

### Suggested Labels
[Auto-detected: frontend/backend/api/database/testing/docs]
```

### Step 3: Infer dependencies

Analyze stories for implicit dependencies:

- Data model stories block API stories
- API stories block frontend stories
- Core utilities block consumers
- Tests may run in parallel

Build dependency graph.

### Step 4: Auto-suggest labels

For each story, detect labels based on content:

| Content Pattern | Label |
|-----------------|-------|
| UI, component, React, CSS | `frontend` |
| API, endpoint, route, handler | `backend` |
| REST, GraphQL, HTTP | `api` |
| schema, migration, model, database | `database` |
| test, spec, coverage | `testing` |
| README, docs, documentation | `docs` |

### Step 5: Present dependency graph

```
## Dependency Graph

Story 1: Create data model
    ↓
Story 2: Add API endpoints ← blocked by Story 1
    ↓
Story 3: Build UI component ← blocked by Story 2

Story 4: Write documentation (no dependencies)
```

### Step 6: User confirmation

```
## Review Stories

[N] stories generated with [M] dependencies.

Stories:
1. [Title] - [labels] - blocked by: [deps]
2. [Title] - [labels] - blocked by: [deps]
...

Adjust anything? [Enter to confirm / or specify changes]
```

Allow user to:
- Rename stories
- Add/remove dependencies
- Modify labels
- Split or merge stories

### Step 7: Save stories artifact

Write to `$FEATURE_DIR/stories.md`:

```markdown
# Stories: $FEATURE_NAME

**Date:** $DATE
**Total:** [N] stories
**Ready for upload:** Yes

## Dependency Graph

[Text-based graph]

## Stories

### Story 1: [Title]
[Full story content with structured sections]

### Story 2: [Title]
...
```

### Step 8: Announce completion

```
✅ Stories Generated

[N] stories saved to: $FEATURE_DIR/stories.md

Dependencies:
- [List of blocking relationships]

Labels:
- frontend: [N] stories
- backend: [N] stories
- ...

Next: Run /ideate:upload to create issues in Linear.
```

## Error Handling

| Error | Action |
|-------|--------|
| plan.md not found | Error: Run /ideate:plan first |
| User requests changes | Apply changes, re-present for confirmation |
| Empty plan | Error: Plan has no actionable content |
```

**Step 2: Verify command length and structure**

```bash
wc -l plugins/ideate/commands/stories.md
grep "### Step" plugins/ideate/commands/stories.md
```

Expected: ~150+ lines, 8 steps

**Step 3: Commit**

```bash
git add plugins/ideate/commands/stories.md
git commit -m "feat(ideate): add stories command

- Decomposes plan into structured stories
- Infers dependencies between stories
- Auto-suggests labels based on content
- Interactive confirmation before save"
```

---

## Task 7: Upload Command

**Files:**
- Create: `plugins/ideate/commands/upload.md`

**Step 1: Create upload command**

Create `plugins/ideate/commands/upload.md`:

```markdown
# /ideate:upload

Upload confirmed stories to Linear as parent issue with sub-issues.

## Prerequisites

Requires `stories.md` with confirmation in the current feature directory.

If not found:
```
❌ ERROR: No stories found.
Run /ideate:stories first.
```

## Process

### Step 1: Load stories and config

Read `$FEATURE_DIR/stories.md`
Read `.claude/ideate.local.md` for Linear settings.

Extract:
- Feature name
- List of stories with dependencies
- Labels for each story
- Target team and project

### Step 2: Verify Linear connection

```
mcp__linear__list_teams()
```

If fails:
```
❌ ERROR: Linear MCP not connected.
Check your MCP configuration and try again.
```

### Step 3: Create parent issue

```
mcp__linear__create_issue(
  title: "Feature: $FEATURE_NAME",
  team: "$LINEAR_TEAM",
  project: "$LINEAR_PROJECT",
  description: "## Overview\n\n$FEATURE_DESCRIPTION\n\n## Stories\n\n[Story count] sub-issues track implementation.\n\n---\n\n*Created via ideate plugin*",
  labels: $DEFAULT_LABELS
)
```

Store the parent issue ID.

### Step 4: Create sub-issues

For each story (in dependency order - create blockers first):

```
mcp__linear__create_issue(
  title: "$STORY_TITLE",
  team: "$LINEAR_TEAM",
  project: "$LINEAR_PROJECT",
  parentId: "$PARENT_ISSUE_ID",
  description: "$STRUCTURED_DESCRIPTION",
  labels: $STORY_LABELS + $DEFAULT_LABELS
)
```

Store each sub-issue ID mapped to story title.

### Step 5: Set blocking relations

For each story with dependencies:

```
mcp__linear__update_issue(
  id: "$STORY_ISSUE_ID",
  blockedBy: ["$BLOCKING_ISSUE_ID_1", "$BLOCKING_ISSUE_ID_2"]
)
```

### Step 6: Update descriptions with links

For each story, update the Dependencies section with Linear links:

```
mcp__linear__update_issue(
  id: "$STORY_ISSUE_ID",
  description: "$DESCRIPTION_WITH_LINEAR_LINKS"
)
```

Format:
```markdown
## Dependencies
- Blocked by: [PROJ-123](linear-link), [PROJ-124](linear-link)
- Blocks: [PROJ-126](linear-link)
```

### Step 7: Announce completion

```
✅ Upload Complete

Parent Issue: [PROJ-100](linear-link) - Feature: $FEATURE_NAME

Sub-Issues:
1. [PROJ-101](link) - $STORY_1_TITLE
2. [PROJ-102](link) - $STORY_2_TITLE ← blocked by PROJ-101
3. [PROJ-103](link) - $STORY_3_TITLE ← blocked by PROJ-102
...

All [N] stories uploaded with dependencies.
```

### Step 8: Save upload record

Append to `$FEATURE_DIR/stories.md`:

```markdown
---

## Linear Upload

**Uploaded:** $TIMESTAMP
**Parent:** [PROJ-100](link)

| Story | Issue | Blocked By |
|-------|-------|------------|
| Story 1 | PROJ-101 | - |
| Story 2 | PROJ-102 | PROJ-101 |
...
```

## Error Handling

| Error | Action |
|-------|--------|
| stories.md not found | Error: Run /ideate:stories first |
| Linear MCP not connected | Error with connection instructions |
| Team/project not found | Error: Run /ideate:setup to reconfigure |
| API error during upload | Save progress, show which stories uploaded, allow retry |
| Partial upload | Show what succeeded, what failed, how to retry |
```

**Step 2: Verify command**

```bash
grep "mcp__linear" plugins/ideate/commands/upload.md
```

Expected: Shows Linear MCP function calls

**Step 3: Commit**

```bash
git add plugins/ideate/commands/upload.md
git commit -m "feat(ideate): add upload command

- Creates parent issue in Linear
- Creates sub-issues with structured descriptions
- Sets blocking relations between stories
- Updates descriptions with Linear links"
```

---

## Task 8: Main Orchestration Command

**Files:**
- Create: `plugins/ideate/commands/ideate.md`

**Step 1: Create main command**

Create `plugins/ideate/commands/ideate.md`:

```markdown
# /ideate $IDEA

Transform an idea into validated, dependency-mapped Linear stories.

## Arguments

- `$IDEA`: The idea to develop (required)

## Overview

This command orchestrates the full ideate workflow:

```
Brainstorm → Pressure Test → Plan → Stories → Upload
```

Each phase saves artifacts to `docs/features/YYYY-MM-DD-<slug>/` enabling resumability.

## Process

### Phase 1: Brainstorm

```
Execute: /ideate:brainstorm "$IDEA"
```

Wait for completion. On error, halt workflow.

Checkpoint: `design.md` saved, UI artifacts if applicable.

---

### Phase 2: Pressure Test

```
Execute: /ideate:pressure-test
```

Wait for sign-off. On rejection, return to relevant step.

Checkpoint: `pressure-test.md` saved with sign-off.

---

### Phase 3: Plan

```
Execute: /ideate:plan
```

Wait for completion.

Checkpoint: `plan.md` saved.

---

### Phase 4: Stories

```
Execute: /ideate:stories
```

Wait for user confirmation.

Checkpoint: `stories.md` saved with confirmation.

---

### Phase 5: Upload

```
Execute: /ideate:upload
```

Wait for completion.

Checkpoint: Stories created in Linear with links.

---

## Completion

```
✅ Ideate Workflow Complete

Feature: $IDEA

Artifacts:
- Design: docs/features/$DIR/design.md
- Pressure Test: docs/features/$DIR/pressure-test.md
- Plan: docs/features/$DIR/plan.md
- Stories: docs/features/$DIR/stories.md

Linear:
- Parent: [PROJ-100](link)
- Stories: [N] sub-issues with dependencies

The feature is ready for implementation.
Use /team:task PROJ-101 to start the first story.
```

## Resumability

If the workflow is interrupted, the user can resume with phase commands:

| If you have... | Run... |
|----------------|--------|
| Nothing | `/ideate "idea"` |
| design.md | `/ideate:pressure-test` |
| pressure-test.md (signed) | `/ideate:plan` |
| plan.md | `/ideate:stories` |
| stories.md (confirmed) | `/ideate:upload` |

## Dependencies

**Required plugins:**
- `superpowers` - For brainstorming and planning skills
- `frontend-designer` - Required if feature has UI (checked during brainstorm)

**Required MCP:**
- Linear MCP - For issue creation and management

## Error Handling

| Error | Action |
|-------|--------|
| Missing superpowers plugin | Error with install instructions, halt |
| Missing frontend-designer (UI) | Error with install instructions, halt |
| Linear MCP not connected | Error with setup instructions, halt |
| Phase fails | Show error, artifacts saved, user can resume |
| User abandons | Artifacts saved at last checkpoint |
```

**Step 2: Verify command**

```bash
head -40 plugins/ideate/commands/ideate.md
```

Expected: Shows overview, phases structure

**Step 3: Commit**

```bash
git add plugins/ideate/commands/ideate.md
git commit -m "feat(ideate): add main orchestration command

- Orchestrates full workflow: brainstorm → pressure test → plan → stories → upload
- Documents resumability with phase commands
- Lists dependencies and error handling"
```

---

## Task 9: Skill Definition

**Files:**
- Create: `plugins/ideate/skills/ideate/SKILL.md`

**Step 1: Create skill**

Create `plugins/ideate/skills/ideate/SKILL.md`:

```markdown
---
name: ideate
description: Transform ideas into validated, dependency-mapped Linear stories. Activates when user wants to develop a new feature idea, create Linear stories from a concept, brainstorm and plan implementation, or mentions "new feature", "I want to build", "break into stories", "create issues for". Commands: /ideate, /ideate:brainstorm, /ideate:pressure-test, /ideate:plan, /ideate:stories, /ideate:upload, /ideate:setup.
---

# Ideate Skill

Transforms raw ideas into structured, validated, implementation-ready Linear stories.

## Workflow

```
/ideate "your feature idea"
    ↓
Phase 1: Brainstorm (superpowers:brainstorming)
    ↓
Phase 2: Pressure Test (mandatory validation)
    ↓
Phase 3: Plan (superpowers:writing-plans)
    ↓
Phase 4: Stories (decompose with dependencies)
    ↓
Phase 5: Upload (Linear parent + sub-issues)
```

## Commands

### `/ideate "idea"`
Full workflow from idea to Linear stories.

### `/ideate:brainstorm "idea"`
Flesh out idea using superpowers:brainstorming. Creates design.md.

### `/ideate:pressure-test`
Mandatory validation: scope drift, assumptions, risks, YAGNI, edge cases.
Requires user sign-off. Creates pressure-test.md.

### `/ideate:plan`
Create implementation plan using superpowers:writing-plans. Creates plan.md.

### `/ideate:stories`
Decompose plan into stories with dependencies and labels. Creates stories.md.

### `/ideate:upload`
Upload to Linear as parent issue + sub-issues with blocking relations.

### `/ideate:setup`
Configure Linear team, project, and default labels.

## Artifacts

All phases save to `docs/features/YYYY-MM-DD-<slug>/`:

- `design.md` - Brainstorm output
- `pressure-test.md` - Validation with sign-off
- `plan.md` - Implementation plan
- `stories.md` - Stories with dependencies
- `ui/` - Frontend designer output (if applicable)

## Story Format

Each story includes:
- Summary (one line)
- Acceptance Criteria (checkboxes)
- Technical Notes
- Test Approach
- Dependencies (blocked by / blocks)
- Labels (auto-suggested)

## Linear Integration

- Parent issue: "Feature: [name]"
- Sub-issues: Individual stories
- Blocking relations: Native Linear "blocked by" fields
- Descriptions: Human-readable dependency section

## Dependencies

- `superpowers` plugin (brainstorming, writing-plans skills)
- `frontend-designer` plugin (if UI features)
- Linear MCP server

## Configuration

Per-project config in `.claude/ideate.local.md`:

```yaml
---
linear_team: "Engineering"
linear_project: "Product Development"
default_labels:
  - "from-ideate"
---
```
```

**Step 2: Verify skill frontmatter**

```bash
head -5 plugins/ideate/skills/ideate/SKILL.md
```

Expected: Shows YAML frontmatter with name and description

**Step 3: Commit**

```bash
git add plugins/ideate/skills/ideate/SKILL.md
git commit -m "feat(ideate): add skill definition

- Activation triggers for ideation workflow
- Documents all commands and workflow
- Describes artifacts and Linear integration"
```

---

## Task 10: Documentation

**Files:**
- Create: `plugins/ideate/README.md`
- Create: `plugins/ideate/CLAUDE.md`

**Step 1: Create README**

Create `plugins/ideate/README.md`:

```markdown
# Ideate Plugin

Transform ideas into validated, dependency-mapped Linear stories.

## Installation

```bash
/plugin install ideate
```

## Quick Start

```bash
# Configure Linear integration
/ideate:setup

# Run full workflow
/ideate "Users need to know when their reports are ready"
```

## Workflow

The plugin orchestrates five phases:

1. **Brainstorm** - Flesh out the idea using collaborative Q&A
2. **Pressure Test** - Validate assumptions, check scope drift, identify risks
3. **Plan** - Create detailed implementation steps
4. **Stories** - Decompose into testable stories with dependencies
5. **Upload** - Create parent issue + sub-issues in Linear

## Commands

| Command | Purpose |
|---------|---------|
| `/ideate "idea"` | Full workflow |
| `/ideate:brainstorm "idea"` | Brainstorm only |
| `/ideate:pressure-test` | Validate design |
| `/ideate:plan` | Create implementation plan |
| `/ideate:stories` | Generate stories |
| `/ideate:upload` | Upload to Linear |
| `/ideate:setup` | Configure defaults |

## Artifacts

Each ideation saves to `docs/features/YYYY-MM-DD-<slug>/`:

```
docs/features/2026-01-04-user-notifications/
├── design.md           # Brainstorm output
├── pressure-test.md    # Validation checkpoint
├── plan.md             # Implementation plan
├── stories.md          # Stories with dependencies
└── ui/                 # Frontend designs (if applicable)
```

## Dependencies

**Required:**
- `superpowers` plugin
- Linear MCP server

**Optional:**
- `frontend-designer` plugin (required if feature has UI)

## Configuration

Per-project settings in `.claude/ideate.local.md`:

```yaml
---
linear_team: "Engineering"
linear_project: "Product Development"
default_labels:
  - "from-ideate"
---
```

## Linear Integration

- **Parent Issue**: Feature container with overview
- **Sub-Issues**: Individual stories as children
- **Dependencies**: Native Linear blocking relations
- **Labels**: Auto-suggested based on story content

## License

MIT
```

**Step 2: Create CLAUDE.md**

Create `plugins/ideate/CLAUDE.md`:

```markdown
# Ideate Plugin Rules

## Workflow Enforcement

The ideate workflow has **mandatory phases** that cannot be skipped:

```
Brainstorm → Pressure Test → Plan → Stories → Upload
```

**Pressure test is mandatory.** Every idea must be validated before planning.

## Phase Requirements

| Phase | Required Artifact | Gate |
|-------|-------------------|------|
| Brainstorm | design.md | Completes |
| Pressure Test | pressure-test.md | User sign-off |
| Plan | plan.md | Completes |
| Stories | stories.md | User confirmation |
| Upload | Linear issues | All created |

## Dependency Rules

When generating stories:
1. Data models block API endpoints
2. API endpoints block frontend components
3. Core utilities block their consumers
4. Tests can often run in parallel

Always present dependency graph for user confirmation.

## UI Features

If a feature has UI components:
- `frontend-designer` plugin is **required**
- Workflow halts if plugin is not installed
- No exceptions - UI design is paramount

## Scope Drift

The pressure test **must** check for scope drift:
1. Compare design back to original idea
2. Flag items that don't trace to original problem
3. User must justify or remove flagged items

## YAGNI Enforcement

During pressure test:
- List all features/complexity
- Ask: "Essential for v1, or defer?"
- Deferred items are logged but **removed from scope**

## Linear Structure

- One parent issue per feature
- Sub-issues for each story
- Native blocking relations (not just description text)
- Both blocking relations AND description section for visibility

## Resumability

Each phase saves artifacts. Users can resume with:
- `/ideate:pressure-test` (has design.md)
- `/ideate:plan` (has signed pressure-test.md)
- `/ideate:stories` (has plan.md)
- `/ideate:upload` (has confirmed stories.md)
```

**Step 3: Verify documentation**

```bash
wc -l plugins/ideate/README.md plugins/ideate/CLAUDE.md
```

Expected: README ~100 lines, CLAUDE.md ~80 lines

**Step 4: Commit**

```bash
git add plugins/ideate/README.md plugins/ideate/CLAUDE.md
git commit -m "docs(ideate): add README and CLAUDE.md

- README: Installation, quick start, commands, configuration
- CLAUDE.md: Workflow rules, enforcement, dependency rules"
```

---

## Task 11: Update Marketplace

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: Read current marketplace**

```bash
cat .claude-plugin/marketplace.json
```

**Step 2: Add ideate plugin**

Update `.claude-plugin/marketplace.json` to include the ideate plugin:

```json
{
  "name": "claude-assistant",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "team-workflow",
      "path": "plugins/team-workflow"
    },
    {
      "name": "ideate",
      "path": "plugins/ideate"
    }
  ]
}
```

**Step 3: Verify JSON validity**

```bash
cat .claude-plugin/marketplace.json | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

Expected: "Valid JSON"

**Step 4: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(marketplace): add ideate plugin

Register ideate plugin in the marketplace manifest"
```

---

## Task 12: Final Verification

**Step 1: Verify complete plugin structure**

```bash
find plugins/ideate -type f | sort
```

Expected output:
```
plugins/ideate/.claude-plugin/plugin.json
plugins/ideate/.mcp.json
plugins/ideate/CLAUDE.md
plugins/ideate/README.md
plugins/ideate/commands/brainstorm.md
plugins/ideate/commands/ideate.md
plugins/ideate/commands/plan.md
plugins/ideate/commands/pressure-test.md
plugins/ideate/commands/setup.md
plugins/ideate/commands/stories.md
plugins/ideate/commands/upload.md
plugins/ideate/skills/ideate/SKILL.md
```

**Step 2: Verify all commands have proper headers**

```bash
for f in plugins/ideate/commands/*.md; do
  echo "=== $f ==="
  head -3 "$f"
done
```

Expected: Each file shows `# /ideate...` header

**Step 3: Count total lines**

```bash
wc -l plugins/ideate/**/*.md plugins/ideate/**/**/*.md 2>/dev/null | tail -1
```

Expected: 800+ total lines across all markdown files

**Step 4: Final commit**

```bash
git log --oneline -10
```

Expected: Shows all ideate-related commits

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | plugin.json, .mcp.json | Plugin scaffold |
| 2 | commands/setup.md | Configuration command |
| 3 | commands/brainstorm.md | Brainstorm phase |
| 4 | commands/pressure-test.md | Validation phase |
| 5 | commands/plan.md | Planning phase |
| 6 | commands/stories.md | Story generation |
| 7 | commands/upload.md | Linear upload |
| 8 | commands/ideate.md | Main orchestration |
| 9 | skills/ideate/SKILL.md | Skill definition |
| 10 | README.md, CLAUDE.md | Documentation |
| 11 | marketplace.json | Marketplace registration |
| 12 | - | Final verification |
