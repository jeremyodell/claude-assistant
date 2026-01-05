# /team:task $ISSUE_ID [--direct] [--use-subagents]

Start work on a Linear issue using the team workflow. This enforces a deterministic, phase-gated development process.

## Arguments

- `$ISSUE_ID`: Linear issue identifier (e.g., `ENG-123`, `PROJ-456`)
- `--direct`: Force direct execution (no subagents) regardless of plan specificity
- `--use-subagents`: Force subagent execution for context isolation

## Workflow Phases

Execute phases sequentially. Do not skip phases. Block progression if any phase fails.

---

### Phase 0: Setup

1. **Fetch issue details**
   ```
   mcp__linear__get_issue(issueId: "$ISSUE_ID")
   ```
   Extract: title, description, labels, assignee, priority

2. **Check for pre-planned label**

   Examine the labels array from the fetched issue. Look for a label with the name "pre-planned" (case-insensitive).

   ```
   labels_array = issue.labels
   has_preplanned = any(label.name.lower() == "pre-planned" for label in labels_array)
   ```

   If `has_preplanned` is true:
   - Set `SKIP_BRAINSTORM_AND_PLAN = true`
   - Announce: "🏷️  Detected 'pre-planned' label - Skipping Phases 1 & 2"

   Otherwise:
   - Set `SKIP_BRAINSTORM_AND_PLAN = false`

3. **Update status to "In Progress"**
   ```
   mcp__linear__update_issue(
     issueId: "$ISSUE_ID",
     stateId: <in_progress_state_id>
   )
   ```
   Note: Query available workflow states first if state ID unknown.

3. **Create feature branch**
   ```bash
   # Slugify the title: lowercase, replace spaces with hyphens, remove special chars
   BRANCH_NAME="feat/$ISSUE_ID-$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')"
   git checkout -b "$BRANCH_NAME"
   ```

4. **Announce phase completion**
   ```
   ✅ Phase 0 Complete
   - Issue: $ISSUE_ID - $TITLE
   - Branch: $BRANCH_NAME
   - Status: In Progress
   - Pre-planned: <YES/NO>
   ```

   If pre-planned: Add note "→ Skipping to Phase 3 (Execute)"

---

### Phase 1: Brainstorm (Superpowers Integration)

**⚠️ CONDITIONAL: Skip this phase if `SKIP_BRAINSTORM_AND_PLAN = true`**

This phase is handled by the Superpowers plugin's brainstorm functionality.

1. **Conduct design brainstorm** - Consider:
   - Problem space analysis
   - Solution approaches (at least 2-3 alternatives)
   - Trade-offs and constraints
   - Technical design decisions
   - Edge cases and failure modes

2. **Request approval** before proceeding

3. **Post design summary to Linear**
   ```
   mcp__linear__create_comment(
     issueId: "$ISSUE_ID",
     body: "## Design Summary\n\n$DESIGN_SUMMARY"
   )
   ```

4. **Announce phase completion**
   ```
   ✅ Phase 1 Complete - Design approved and posted to Linear
   ```

---

### Phase 2: Plan (Superpowers Integration)

**⚠️ CONDITIONAL: Skip this phase if `SKIP_BRAINSTORM_AND_PLAN = true`**

This phase is handled by the Superpowers plugin's planning functionality.

1. **Create detailed task breakdown**:
   - Atomic, testable tasks
   - Clear acceptance criteria per task
   - Dependency ordering
   - Time estimates (optional)

2. **Request approval** before proceeding

3. **Post plan to Linear**
   ```
   mcp__linear__create_comment(
     issueId: "$ISSUE_ID",
     body: "## Implementation Plan\n\n$TASK_LIST"
   )
   ```

4. **Announce phase completion**
   ```
   ✅ Phase 2 Complete - Plan approved and posted to Linear
   ```

---

### Execution Mode Detection

**For pre-planned tickets:** If `SKIP_BRAINSTORM_AND_PLAN = true`, the issue description should already contain the implementation plan. Use this description as the plan for mode detection.

After plan approval (or for pre-planned tickets, after Phase 0), determine execution mode based on plan specificity:

**Analyze plan specificity:**

| Indicator | Score |
|-----------|-------|
| Task has code blocks with implementation | +2 |
| Task mentions specific file paths | +1 |
| Task uses vague language ("figure out", "investigate", "decide") | -2 |

**Decision logic:**

```
If --direct flag provided:
  → DIRECT MODE

If --use-subagents flag provided:
  → SUBAGENT MODE

If total_score >= 2 (plan is specific):
  → DIRECT MODE

Else (plan is vague):
  → SUBAGENT MODE
```

**Announce execution mode:**

```
Execution mode: DIRECT (plan contains specific code)
To override: re-run with --use-subagents
```
or
```
Execution mode: SUBAGENT (plan requires exploration)
To override: re-run with --direct
```

---

### Phase 3: Execute (TDD Required)

Execute tasks using strict TDD methodology. Execution approach depends on the mode determined above.

---

#### DIRECT MODE (Default for Specific Plans)

Execute all tasks inline without spawning subagents. This preserves context and reduces token usage by ~60%.

**For each task:**

1. **Write failing test first**
   - Test must fail before implementation
   - Test must cover the task's acceptance criteria

2. **Implement minimum code to pass**
   - No more than necessary to make the test green
   - Refactor after green

3. **Run tests after each change**
   ```bash
   npm test
   ```

4. **Perform code review between tasks**
   - Use `/code-review` command
   - Address any issues before next task

**Announcement after each task:**
```
✅ Task N Complete
- Tests: X passing
- Coverage: Y%
```

---

#### SUBAGENT MODE (For Vague Plans)

Use `superpowers:subagent-driven-development` to spawn isolated agents for each task.

**When to use:**
- Plan requires exploration of unfamiliar code
- Tasks involve complex decisions with trade-offs
- Context isolation helps prevent mistakes
- Parallel execution would be beneficial

**Execution:**
1. Invoke `superpowers:subagent-driven-development` skill
2. Each task runs in isolated subagent context
3. Subagents follow TDD requirements independently
4. Results aggregated by orchestrator

**Note:** Subagent mode uses more tokens but provides fresh context per task, which helps when exploration is needed.

---

### Phase 4: Quality Gates

Run quality check to validate all gates pass:

```
/team:quality-check
```

**Gate requirements (ALL must pass):**
- `npm test` - ZERO failures
- `npm run lint` - ZERO errors
- `npm run typecheck` - ZERO errors
- `/code-review` - ZERO high-confidence issues (≥80%)

**If ANY gate fails:**
- Stop workflow
- Display failures with fix instructions
- State: "❌ QUALITY GATES BLOCKED - Fix issues before proceeding"
- Do NOT proceed to Phase 5

**If ALL gates pass:**
- State: "✅ ALL QUALITY GATES PASSED"
- Proceed to Phase 5

---

### Phase 5: Ship

Execute the ship command:

```
/team:ship
```

This will:
- Commit all changes with conventional commit message
- Push the branch
- Create pull request
- Update Linear status to "In Review"
- Post PR link to Linear

---

## Error Handling

| Error | Action |
|-------|--------|
| Linear API failure | Retry 3x with exponential backoff, then halt |
| Git operation failure | Display error, do not auto-recover |
| Test failure | Halt execution, display failing tests |
| Lint/Type errors | Halt execution, display errors with file:line |
| Branch already exists | Prompt user to delete or use existing |

## State Persistence

Track workflow state mentally across the conversation:
- Current phase
- Completed tasks
- Pending blockers
- Linear comments posted

If conversation is interrupted, use Linear comments to reconstruct state.
