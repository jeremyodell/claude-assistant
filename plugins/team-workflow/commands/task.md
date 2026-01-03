# /team:task $ISSUE_ID

Start work on a Linear issue using the team workflow. This enforces a deterministic, phase-gated development process.

## Arguments

- `$ISSUE_ID`: Linear issue identifier (e.g., `ENG-123`, `PROJ-456`)

## Workflow Phases

Execute phases sequentially. Do not skip phases. Block progression if any phase fails.

---

### Phase 0: Setup

1. **Fetch issue details**
   ```
   mcp__linear__get_issue(issueId: "$ISSUE_ID")
   ```
   Extract: title, description, labels, assignee, priority

2. **Update status to "In Progress"**
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
   ```

---

### Phase 1: Brainstorm (Superpowers Integration)

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

### Phase 3: Execute (TDD Required)

Execute tasks using strict TDD methodology. Superpowers enforces this.

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
