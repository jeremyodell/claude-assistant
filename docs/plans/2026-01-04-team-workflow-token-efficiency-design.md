# Team Workflow Token Efficiency Design

**Date:** 2026-01-04
**Status:** Approved
**Problem:** Subagents used unconditionally, causing redundant file reads and ~60% token overhead for detailed plans

## Summary

Add conditional execution mode detection to `/team:task`. When a plan contains specific code, execute directly in the main context. When a plan is vague and requires exploration, use subagents.

## Plan Specificity Detection

After Phase 2 (Plan) approval, analyze plan specificity:

**SPECIFIC PLAN indicators (→ direct execution):**
- Contains code blocks with implementation
- Has exact file paths mentioned
- Includes line numbers or specific function names
- Tasks are 1-2 sentence descriptions of what to write

**VAGUE PLAN indicators (→ subagent execution):**
- Tasks describe outcomes without implementation details
- Contains phrases like "figure out", "investigate", "decide how"
- No code blocks, just acceptance criteria
- Requires exploration of unfamiliar codebase areas

**Decision logic:**

```
score = 0
for each task in plan:
  if has_code_blocks(task): score += 2
  if has_file_paths(task): score += 1
  if has_vague_language(task): score -= 2

if score >= threshold OR --direct flag:
  → Execute inline (no subagents)
else if --use-subagents flag:
  → Force subagent execution
else:
  → Use subagents (default for low-specificity plans)
```

**Override flags:**
- `--direct` - Force direct execution regardless of plan specificity
- `--use-subagents` - Force subagent execution for context isolation

## Execution Modes

### Direct Execution Mode

For each task in plan:
1. Write failing test
2. Run tests (confirm failure)
3. Write implementation
4. Run tests (confirm pass)
5. Mark task complete

**Benefits:**
- Single context (no re-reads)
- ~60% fewer tokens
- Faster execution

### Subagent Execution Mode

Uses `superpowers:subagent-driven-development`:
- Spawn fresh subagent per task
- Subagent explores, decides, implements
- Returns result to orchestrator

**Benefits:**
- Fresh context for complex decisions
- Isolated failures
- Good for exploration-heavy tasks

## User Feedback

After plan approval, show execution mode:

```
✅ Phase 2 Complete - Plan approved

Execution mode: DIRECT (plan contains specific code)
To override: re-run with --use-subagents

Proceeding to Phase 3...
```

## File Changes

| File | Change |
|------|--------|
| `commands/task.md` | Add execution mode detection after Phase 2, add direct execution instructions to Phase 3 |
| `skills/team-workflow/SKILL.md` | Update Integration with Superpowers section to explain conditional usage |
| `CLAUDE.md` | Add guidance on when subagents are/aren't appropriate |

## Unchanged Files

- `commands/feature.md` - Parallel orchestration still uses subagents (correct for that use case)
- `commands/quality-check.md` - No subagent usage
- `commands/ship.md` - No subagent usage
