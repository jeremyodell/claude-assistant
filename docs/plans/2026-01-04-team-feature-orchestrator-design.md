# Team Feature Orchestrator Design

**Date:** 2026-01-04
**Status:** Approved
**Plugin:** team-workflow

## Overview

Add `/team:feature` command to orchestrate parallel execution of sub-tasks under a parent Linear issue. The orchestrator analyzes dependencies, spawns color-coded subagents for independent tasks, and coordinates merges on a shared feature branch.

## Command Interface

```
/team:feature $PARENT_ISSUE_ID [--parallel=N]
```

**Arguments:**
- `$PARENT_ISSUE_ID` - Linear issue ID of the parent (e.g., `PROJ-100`)
- `--parallel=N` - Max concurrent agents (default: 3, range: 1-6)

**Examples:**
```bash
/team:feature PROJ-100              # Default 3 parallel agents
/team:feature PROJ-100 --parallel=2 # Conservative
/team:feature PROJ-100 --parallel=5 # Aggressive
```

**Validation:**
- Error if issue has no sub-issues
- Error if issue is not a parent
- Error if Linear MCP not connected
- Error if circular dependencies detected

## Dependency Graph

### Construction

Fetch sub-issues with `blockedBy` relations from Linear to build a DAG:

```
PROJ-101 (no blockers)     ──┐
PROJ-102 (no blockers)     ──┼──► Wave 1 (parallel)
PROJ-103 (no blockers)     ──┘

PROJ-104 (blocked by 101)  ──┐
PROJ-105 (blocked by 102)  ──┼──► Wave 2 (after dependencies merge)

PROJ-106 (blocked by 104, 105) ──► Wave 3
```

### Execution Algorithm

```
1. Initialize: ready_queue = tasks with no blockers
2. While tasks remain:
   a. Pop up to N tasks from ready_queue (N = parallel limit)
   b. Spawn subagent for each task
   c. When a subagent completes:
      - Merge task branch to feature branch
      - Mark task done (or failed)
      - For each task blocked by it:
        - If all blockers done → add to ready_queue
   d. Repeat until ready_queue empty and no agents running
```

### Cycle Detection

Before execution, validate no cycles exist:
```
Error: Circular dependency detected: PROJ-101 ↔ PROJ-102
Please fix blocking relationships in Linear before continuing.
```

## Branch Strategy

### Feature Branch with Merge-Forward

```
main
  └── feat/PROJ-100-user-auth (feature branch)
        ├── feat/PROJ-101-auth-endpoint     → merge back when done
        ├── feat/PROJ-102-db-migrations     → merge back when done
        └── ...
```

### Flow

1. Create feature branch `feat/PROJ-100-*` from main
2. Each task branches from feature branch (not main)
3. When task completes:
   - Merge task branch back to feature branch
   - Push feature branch
4. Dependent tasks wait for blockers to merge
5. Dependent tasks branch from updated feature branch
6. Final: Single PR from feature branch → main

### Benefits

- Independent tasks run in parallel
- Dependent tasks get blocker code via feature branch
- Single PR for whole feature (easier review)
- No stacked branch complexity

## Subagent Spawning

### Color Palette

```typescript
const AGENT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
];
```

Colors cycle: agent index % palette length.

### Agent Configuration

Each subagent receives:
- **Color:** Next from palette rotation
- **Title:** `$ISSUE_ID: $ISSUE_TITLE` (truncated to 50 chars)
- **Prompt:** Execute `/team:task $ISSUE_ID` with full context

### Visual Result

```
🔵 PROJ-101: Add user authentication endpoint
🟢 PROJ-102: Create database migrations
🟣 PROJ-103: Set up API rate limiting
```

## Failure Handling

### Isolation Strategy

When a subagent fails:
1. Mark task: `failed` with error details
2. Mark dependent tasks: `blocked_by_failure`
3. Continue independent tasks
4. Include in final summary

### Task States

| State | Description |
|-------|-------------|
| `pending` | Waiting for blockers |
| `ready` | Queued to run |
| `running` | Subagent active |
| `completed` | Finished with PR |
| `failed` | Error encountered |
| `blocked_by_failure` | Dependency failed |

## Progress Reporting

### 1. Status Line (real-time)

```
Feature PROJ-100: 3/8 done | 2 running | 1 failed | 2 blocked
```

### 2. Console Updates (every 2 minutes)

```
┌─────────────────────────────────────────────────┐
│ PROJ-100 Progress Update                        │
├──────────┬──────────────────────────┬───────────┤
│ PROJ-101 │ Add auth endpoint        │ ✅ Done   │
│ PROJ-102 │ Database migrations      │ 🔄 Running│
│ PROJ-103 │ Rate limiting            │ ❌ Failed │
│ PROJ-104 │ Auth tests               │ ⏳ Pending│
└──────────┴──────────────────────────┴───────────┘
```

### 3. Linear Comments (milestones)

Post to parent issue:
- When first wave starts
- When each wave completes
- On any failure (with error summary)
- On completion

## Completion

### Final Summary

```
╔═══════════════════════════════════════════════════════════════╗
║  Feature Complete: PROJ-100 - User Authentication System      ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ Completed (5)                                             ║
║     PROJ-101: Add auth endpoint          → merged             ║
║     PROJ-102: Database migrations        → merged             ║
║     PROJ-104: Auth middleware            → merged             ║
║     PROJ-105: Session management         → merged             ║
║     PROJ-107: Integration tests          → merged             ║
║                                                               ║
║  ❌ Failed (1)                                                ║
║     PROJ-103: Rate limiting              → Tests failed       ║
║                                                               ║
║  ⏸️  Blocked (1)                                              ║
║     PROJ-106: Rate limit tests           → Blocked by 103     ║
║                                                               ║
║  Feature Branch: feat/PROJ-100-user-auth                      ║
╚═══════════════════════════════════════════════════════════════╝
```

### Next Action Prompt

```
What would you like to do?

1. Create PR from feature branch to main
2. Retry failed tasks
3. View failure details for PROJ-103
4. Exit and handle manually
```

### Linear Update

- Post summary to parent issue
- Update parent status:
  - "In Review" if all tasks completed
  - "Blocked" if any failures

## File Structure

### New Files

```
plugins/team-workflow/
├── commands/
│   └── feature.md           # NEW - orchestrator command
```

### Updates

```
plugins/team-workflow/
├── skills/
│   └── team-workflow/
│       └── SKILL.md         # Add feature trigger
├── CLAUDE.md                # Document feature workflow
└── README.md                # Document new command
```

## Implementation Notes

### Subagent Communication

Each subagent runs `/team:task` which:
- Handles single-task workflow (brainstorm → plan → execute → quality → ship)
- Creates task branch from current HEAD (feature branch)
- On completion, merges to feature branch (not main)
- Reports success/failure back to orchestrator

### Merge Coordination

Orchestrator must:
1. Wait for subagent completion signal
2. Pull latest feature branch
3. Merge task branch (should be clean if based on feature branch)
4. Push feature branch
5. Only then mark blockers as satisfied

### Parallel Limits

- Default: 3 concurrent agents
- Range: 1-6 (enforced)
- Consider: Memory, CPU, Linear API rate limits

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Command name | `/team:feature` | Clear separation from `/team:task` |
| Parallelism | Dependency + limit | Balance throughput and resources |
| Default limit | 3 agents | Reasonable for most machines |
| Colors | Fixed palette rotation | Simple, visually distinct |
| Failure handling | Isolate and continue | Maximize completed work |
| Progress reporting | Status + console + Linear | Full visibility across contexts |
| Completion | Summary + prompt | User controls next steps |
| Branch strategy | Feature branch merge-forward | Enables code dependencies |
