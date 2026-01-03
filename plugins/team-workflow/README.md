# Team Workflow Plugin for Claude Code

A deterministic team development workflow plugin that enforces TDD, integrates with Linear, and gates PR creation on quality checks.

## What This Plugin Does

This plugin enforces a **deterministic, phase-gated workflow** for all development work:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEAM WORKFLOW PIPELINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /team:task ENG-123                                            │
│        │                                                        │
│        ▼                                                        │
│  ┌──────────────┐                                              │
│  │  Phase 0:    │  • Fetch Linear issue                        │
│  │  Setup       │  • Update status → "In Progress"             │
│  │              │  • Create branch: feat/ENG-123-title         │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  Phase 1:    │  • Design thinking                           │
│  │  Brainstorm  │  • Solution exploration                      │
│  │              │  • Post summary → Linear comment             │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  Phase 2:    │  • Task breakdown                            │
│  │  Plan        │  • Acceptance criteria                       │
│  │              │  • Post plan → Linear comment                │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  Phase 3:    │  • TDD: Test first, always                   │
│  │  Execute     │  • Code review between tasks                 │
│  │              │  • Incremental implementation                │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  /team:quality-check                                           │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  Phase 4:    │  ☑ npm test        (0 failures)             │
│  │  Quality     │  ☑ npm run lint    (0 errors)               │
│  │  Gates       │  ☑ npm run typecheck (0 errors)             │
│  │              │  ☑ /code-review    (0 high-conf issues)     │
│  └──────┬───────┘                                              │
│         │ ALL PASS                                              │
│         ▼                                                       │
│  /team:ship                                                    │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  Phase 5:    │  • Commit with conventional message          │
│  │  Ship        │  • Push branch                               │
│  │              │  • Create PR via gh                          │
│  │              │  • Update Linear → "In Review"               │
│  │              │  • Post PR link → Linear comment             │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before using this plugin, ensure you have:

1. **Superpowers Plugin** - For brainstorm/plan phases and TDD enforcement
   ```
   /plugin install superpowers
   ```

2. **Linear MCP Authentication** - The plugin will prompt for OAuth when first used
   - Linear API access is handled via MCP

3. **GitHub CLI** - For PR creation
   ```bash
   brew install gh  # macOS
   gh auth login
   ```

4. **npm Scripts** - Your project needs these scripts in `package.json`:
   ```json
   {
     "scripts": {
       "test": "jest",
       "lint": "eslint .",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

## Installation

### From GitHub

```
/plugin install https://github.com/YOUR_USERNAME/team-workflow-plugin
```

### From Local Directory

```
/plugin install ./path/to/team-workflow
```

### Validate Installation

```
/plugin validate team-workflow
```

## Quick Start

1. **Start work on an issue:**
   ```
   /team:task ENG-123
   ```

2. **Complete brainstorm phase** (Superpowers guides this)
   - Explore the problem space
   - Consider multiple solutions
   - Get approval before proceeding

3. **Complete plan phase** (Superpowers guides this)
   - Break down into atomic tasks
   - Define acceptance criteria
   - Get approval before proceeding

4. **Execute with TDD**
   - Write failing test
   - Implement to pass
   - Refactor
   - Repeat

5. **Check quality gates:**
   ```
   /team:quality-check
   ```

6. **Ship when all gates pass:**
   ```
   /team:ship
   ```

## Command Reference

### `/team:task $ISSUE_ID`

Start work on a Linear issue. Guides you through all workflow phases.

**Arguments:**
- `$ISSUE_ID` - Linear issue identifier (e.g., `ENG-123`)

**Actions:**
- Fetches issue from Linear
- Updates status to "In Progress"
- Creates feature branch
- Initiates brainstorm → plan → execute flow
- Posts progress to Linear comments

### `/team:quality-check`

Run all quality gates and report status.

**Gates (all must pass):**
| Gate | Command | Requirement |
|------|---------|-------------|
| Tests | `npm test` | 0 failures |
| Lint | `npm run lint` | 0 errors |
| Types | `npm run typecheck` | 0 errors |
| Review | `/code-review` | 0 issues ≥80% confidence |

**Output:**
- Status table with pass/fail for each gate
- Detailed failures with file:line locations
- Fix instructions for failures

### `/team:ship`

Create PR and update Linear (only if quality gates pass).

**Actions:**
- Verifies on feature branch
- Re-runs all quality gates
- Creates commit with conventional message
- Pushes branch
- Creates PR via `gh pr create`
- Updates Linear status to "In Review"
- Posts PR link as Linear comment

## GitHub Actions

Copy these workflow files to your repo's `.github/workflows/` directory:

### Code Review (`claude-code-review.yml`)
Automatically reviews PRs using Claude when opened or updated.

### Security Review (`claude-security-review.yml`)
Scans PRs for security vulnerabilities, uploads findings to GitHub Security tab.

**Required secret:** `ANTHROPIC_API_KEY`

## Configuration

### Project CLAUDE.md

Copy `CLAUDE.md` to your project root to document team workflow rules for Claude.

### MCP Configuration

The `.mcp.json` file configures the Linear MCP server:
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

## Design Principles

1. **Deterministic** - Same input → same process → same quality
2. **Enforced, not suggested** - Hooks block violations automatically
3. **Transparent** - Linear shows progress at each phase
4. **Team-consistent** - Shared config via plugin installation
5. **Defense in depth** - Multiple review layers:
   - Superpowers code review during execution
   - `/code-review` at quality gate
   - GitHub Action on PR

## Troubleshooting

### Linear MCP not connecting
1. Check MCP server is running
2. Re-authenticate: MCP will prompt for OAuth

### Quality gates failing
1. Run `/team:quality-check` to see specific failures
2. Check npm scripts exist in `package.json`
3. Ensure test/lint configs are valid

### PR creation failing
1. Verify `gh auth status` shows authenticated
2. Check you're on a feature branch
3. Ensure remote exists: `git remote -v`

### Hooks not running
1. Verify `hooks/hooks.json` syntax
2. Check script permissions: `chmod +x hooks/*.sh`
3. Validate plugin: `/plugin validate team-workflow`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following this plugin's own workflow!
4. Submit a PR

## License

MIT
