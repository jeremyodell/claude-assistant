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

### Step 3: Ensure "pre-planned" label exists

Check if the "pre-planned" label exists in Linear:

```
mcp__linear__list_issue_labels(team: "$LINEAR_TEAM")
```

If "pre-planned" label does not exist:

```
mcp__linear__create_issue_label(
  name: "pre-planned",
  description: "Issue has detailed implementation plan from ideate - skip brainstorm/plan phases in team-workflow",
  color: "#7C3AED",
  teamId: "$LINEAR_TEAM_ID"
)
```

Store the label name/ID for use in subsequent steps.

### Step 4: Create parent issue

```
mcp__linear__create_issue(
  title: "Feature: $FEATURE_NAME",
  team: "$LINEAR_TEAM",
  project: "$LINEAR_PROJECT",
  description: "## Overview\n\n$FEATURE_DESCRIPTION\n\n## Stories\n\n[Story count] sub-issues track implementation.\n\n---\n\n*Created via ideate plugin*",
  labels: $DEFAULT_LABELS + ["pre-planned"]
)
```

Store the parent issue ID.

### Step 5: Create sub-issues

For each story (in dependency order - create blockers first):

```
mcp__linear__create_issue(
  title: "$STORY_TITLE",
  team: "$LINEAR_TEAM",
  project: "$LINEAR_PROJECT",
  parentId: "$PARENT_ISSUE_ID",
  description: "$STRUCTURED_DESCRIPTION",
  labels: $STORY_LABELS + $DEFAULT_LABELS + ["pre-planned"]
)
```

**Important:** All sub-issues get the "pre-planned" label because they contain detailed implementation plans from the ideate workflow.

Store each sub-issue ID mapped to story title.

### Step 6: Set blocking relations

For each story with dependencies:

```
mcp__linear__update_issue(
  id: "$STORY_ISSUE_ID",
  blockedBy: ["$BLOCKING_ISSUE_ID_1", "$BLOCKING_ISSUE_ID_2"]
)
```

### Step 7: Update descriptions with links

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

### Step 8: Announce completion

```
✅ Upload Complete

Parent Issue: [PROJ-100](linear-link) - Feature: $FEATURE_NAME

Sub-Issues:
1. [PROJ-101](link) - $STORY_1_TITLE
2. [PROJ-102](link) - $STORY_2_TITLE ← blocked by PROJ-101
3. [PROJ-103](link) - $STORY_3_TITLE ← blocked by PROJ-102
...

All [N] stories uploaded with dependencies.
All sub-issues labeled with "pre-planned" for team-workflow integration.
```

### Step 9: Save upload record

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
