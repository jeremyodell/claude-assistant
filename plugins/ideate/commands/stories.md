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
