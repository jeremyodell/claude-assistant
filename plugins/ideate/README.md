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
