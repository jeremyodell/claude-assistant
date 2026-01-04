# Ideate Plugin Design

**Date:** 2026-01-04
**Status:** Approved

## Overview

**ideate** is a Claude Code plugin that transforms raw ideas into validated, dependency-mapped Linear stories.

The plugin orchestrates a five-phase workflow:
1. **Brainstorm** - Flesh out the idea using superpowers:brainstorming
2. **Pressure Test** - Validate assumptions, check scope drift, identify risks
3. **Plan** - Create implementation details using superpowers:writing-plans
4. **Stories** - Decompose into testable stories with dependencies
5. **Upload** - Create parent issue + sub-issues in Linear

## Commands

| Command | Purpose |
|---------|---------|
| `/ideate "idea"` | Full workflow: brainstorm → pressure test → plan → stories → upload |
| `/ideate:brainstorm "idea"` | Run only the brainstorm phase |
| `/ideate:pressure-test` | Run pressure test on existing design |
| `/ideate:plan` | Run planning on validated design |
| `/ideate:stories` | Generate stories from existing plan |
| `/ideate:upload` | Upload stories to Linear |
| `/ideate:setup` | Configure Linear team/project defaults |

## Workflow Phases

### Phase 1: Brainstorm

1. Invoke `superpowers:brainstorming` skill
2. Save output to `design.md`
3. Post-brainstorm follow-up questions:
   - "Does this feature have UI components?"
     - If yes → require and invoke `frontend-designer` plugin
   - "Upload to [configured team/project]?" (allow override)

### Phase 2: Pressure Test (Mandatory)

Six-step validation checkpoint:

**Step 1: Scope Drift Check**
Compare design back to original idea. Flag items that don't trace to the original problem. User must justify or remove.

**Step 2: Assumption Challenge**
Extract 3-5 key assumptions and challenge each. Capture user responses.

**Step 3: Risk Identification**
Surface technical and product risks. User must acknowledge or add mitigations.

**Step 4: YAGNI Check**
List features/complexity and ask: "Essential for first version, or defer?" Deferred items logged but removed from scope.

**Step 5: Edge Cases**
Prompt for failure modes and how to handle them.

**Step 6: Sign-off**
User confirms design solves original problem. Captured with timestamp.

Save output to `pressure-test.md`.

### Phase 3: Plan

1. Invoke `superpowers:writing-plans` skill
2. Save output to `plan.md`

### Phase 4: Stories

1. AI decomposes plan into stories
2. Infer dependencies between stories
3. Auto-suggest labels based on content
4. Present dependency graph for user confirmation
5. Save output to `stories.md`

### Phase 5: Upload

1. Create parent issue in Linear (feature title)
2. Create sub-issues with structured descriptions
3. Set native blocking relations
4. Apply confirmed labels
5. Display links to created issues

## Story Format

Each story uses a structured description:

```markdown
## Summary
[One-line description of what this story delivers]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
[Implementation guidance, architectural decisions, constraints]

## Test Approach
[How to verify this works - unit tests, integration tests, manual checks]

## Dependencies
- Blocked by: [Story title(s) or "None"]
- Blocks: [Story title(s) or "None"]
```

## Linear Integration

### Hierarchy

- **Parent Issue**: The feature (e.g., "Feature: User Notifications")
- **Sub-issues**: Individual stories
- **Blocking Relations**: Native Linear "blocked by" / "blocks" fields
- **Description**: Human-readable dependency section for quick scanning

### Auto-Suggested Labels

Based on story content:
- `frontend` / `backend` / `api` / `database`
- `testing` / `docs`
- `design-needed` (if UI without mockups)

Labels shown for confirmation before upload.

## File Structure

### Artifact Directory

```
docs/features/
└── YYYY-MM-DD-<slug>/
    ├── design.md           # Output from brainstorm phase
    ├── pressure-test.md    # Validation checkpoint
    ├── plan.md             # Implementation plan
    ├── stories.md          # Story breakdown with dependencies
    └── ui/                 # Frontend designer output (if applicable)
        ├── mockups/
        └── components.md
```

### Plugin Structure

```
plugins/ideate/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── commands/
│   ├── ideate.md
│   ├── brainstorm.md
│   ├── pressure-test.md
│   ├── plan.md
│   ├── stories.md
│   ├── upload.md
│   └── setup.md
├── skills/
│   └── ideate/
│       └── SKILL.md
├── README.md
└── CLAUDE.md
```

## Configuration

### Config File

`.claude/ideate.local.md` - Per-project settings:

```yaml
---
linear_team: "Engineering"
linear_project: "Product Development"
default_labels:
  - "from-ideate"
frontend_designer_plugin: "frontend-designer"
---
```

### First Run Setup

When config missing:
1. Prompt user to set up
2. Fetch Linear teams via MCP
3. Fetch projects for selected team
4. Ask about default labels
5. Write config file

### Override at Runtime

During post-brainstorm questions, allow one-off override of team/project.

## Dependencies

| Dependency | Purpose | Required? |
|------------|---------|-----------|
| `superpowers:brainstorming` | Design phase | Yes |
| `superpowers:writing-plans` | Planning phase | Yes |
| `frontend-designer` plugin | UI mockups/specs | Yes, if feature has UI |
| Linear MCP | Issue creation | Yes |

## Error Handling

| Scenario | Action |
|----------|--------|
| Missing superpowers plugin | Error with install instructions, halt |
| Missing frontend-designer (UI needed) | Error with install instructions, halt |
| Linear MCP not authenticated | Prompt to authenticate, pause workflow |
| Linear API error during upload | Save stories.md, allow retry with `/ideate:upload` |
| User abandons mid-session | Artifacts saved, resume with phase command |
| Design file missing for later phase | Error with "run phase command first" |

## Resumability

Each phase checks for required artifacts:

- `/ideate:pressure-test` → requires `design.md`
- `/ideate:plan` → requires `pressure-test.md` (with sign-off)
- `/ideate:stories` → requires `plan.md`
- `/ideate:upload` → requires `stories.md` (with confirmation)

If artifact exists but user wants to redo:
```
"design.md already exists. Overwrite? [y/N]"
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Command structure | Hybrid: main + phase commands | Streamlined happy path with flexibility |
| Brainstorm integration | Two-stage with superpowers | Let existing skill do what it does well |
| Frontend design | Mandatory if UI | UI design is paramount for UI features |
| Pressure test | Mandatory with scope drift | Ensures validation before planning investment |
| Linear hierarchy | Parent issue + sub-issues | Simple, built-in progress tracking |
| Dependencies | Native blocking + description | Best of both: tooling + readability |
| Dependency detection | AI-inferred with confirmation | Automation with user control |
| Configuration | Per-project file with override | Sensible defaults, flexible when needed |
| Checkpoints | File-based artifacts | Enables resumability and documentation |
