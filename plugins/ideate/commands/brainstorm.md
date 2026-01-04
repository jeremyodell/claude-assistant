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
