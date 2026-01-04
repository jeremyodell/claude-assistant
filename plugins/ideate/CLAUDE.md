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
