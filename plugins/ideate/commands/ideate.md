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
