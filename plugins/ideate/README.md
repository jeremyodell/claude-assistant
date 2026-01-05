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
- **Pre-Planned Label**: Automatically added to all issues for team-workflow integration

### Team-Workflow Integration

When you upload stories to Linear using `/ideate:upload`, all issues are automatically labeled with `pre-planned`. This integrates with the `team-workflow` plugin:

**What happens:**
1. `/ideate:upload` creates the "pre-planned" label if it doesn't exist
2. All parent and sub-issues receive this label
3. When using `/team:task` with these issues, brainstorm and plan phases are skipped
4. Workflow jumps directly to TDD execution

**Why this matters:**
- Eliminates duplicate planning work
- Your detailed story descriptions become the implementation plan
- Faster workflow: 5 phases → 3 phases for pre-planned tickets
- Seamless handoff from ideation to execution

**Label Details:**
- **Name:** `pre-planned`
- **Color:** `#7C3AED` (purple)
- **Description:** "Issue has detailed implementation plan from ideate - skip brainstorm/plan phases in team-workflow"

## License

MIT
