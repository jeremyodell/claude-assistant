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
