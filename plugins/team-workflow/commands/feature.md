# /team:feature $PARENT_ISSUE_ID [--parallel=N]

Orchestrate parallel execution of sub-tasks under a parent Linear issue. Analyzes dependencies, spawns color-coded subagents for independent tasks, and coordinates merges on a shared feature branch.

## Arguments

- `$PARENT_ISSUE_ID`: Linear issue identifier of the parent (e.g., `PROJ-100`, `ENG-50`)
- `--parallel=N`: Maximum concurrent agents (default: 3, range: 1-6)

## Color Palette

Assign colors to subagents in rotation:

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

---

## Phase 0: Validation

### 1. Verify Linear Connection

Test MCP connectivity:
```
mcp__linear__get_issue(id: "$PARENT_ISSUE_ID")
```

**If connection fails:**
```
❌ Error: Linear MCP not connected
Please ensure the Linear MCP server is running and authenticated.
```
Stop execution.

### 2. Fetch Parent Issue and Sub-Issues

```
mcp__linear__get_issue(id: "$PARENT_ISSUE_ID", includeRelations: true)
mcp__linear__list_issues(parentId: "$PARENT_ISSUE_ID")
```

**If no sub-issues:**
```
❌ Error: Issue $PARENT_ISSUE_ID has no sub-issues
Create sub-issues in Linear before using /team:feature
```
Stop execution.

### 3. Build Dependency Graph

For each sub-issue, fetch blocking relations:
```
mcp__linear__get_issue(id: "$SUB_ISSUE_ID", includeRelations: true)
```

Extract `blockedBy` array to build a Directed Acyclic Graph (DAG).

### 4. Detect Cycles

Perform topological sort validation. If cycles exist:
```
❌ Error: Circular dependency detected: PROJ-101 ↔ PROJ-102
Please fix blocking relationships in Linear before continuing.
```
Stop execution.

### 5. Parse Parallel Limit

Extract `--parallel=N` from arguments. Validate:
- Default: 3
- Minimum: 1
- Maximum: 6

**If out of range:**
```
⚠️ Warning: --parallel=$N out of range (1-6), using default: 3
```

### 6. Announce Validation Complete

```
✅ Phase 0 Complete - Validation Passed
- Parent: $PARENT_ISSUE_ID - $PARENT_TITLE
- Sub-issues: $COUNT tasks
- Dependencies: $DEP_COUNT blocking relationships
- Max parallel: $PARALLEL_LIMIT agents
```

---

## Phase 1: Setup Feature Branch

### 1. Create Feature Branch from Main

```bash
git checkout main
git pull origin main
BRANCH_NAME="feat/$PARENT_ISSUE_ID-$(echo "$PARENT_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g' | head -c 50)"
git checkout -b "$BRANCH_NAME"
git push -u origin "$BRANCH_NAME"
```

### 2. Update Parent Issue Status

```
mcp__linear__update_issue(
  id: "$PARENT_ISSUE_ID",
  state: "In Progress"
)
```

### 3. Post Initial Comment to Linear

```
mcp__linear__create_comment(
  issueId: "$PARENT_ISSUE_ID",
  body: "## Feature Development Started\n\n**Branch:** `$BRANCH_NAME`\n**Tasks:** $COUNT sub-issues\n**Parallel limit:** $PARALLEL_LIMIT agents\n\nOrchestrator will post updates as waves complete."
)
```

### 4. Announce Setup Complete

```
✅ Phase 1 Complete - Feature Branch Created
- Branch: $BRANCH_NAME
- Status: In Progress
- Ready to spawn subagents
```

---

## Phase 2: Execute Dependency Waves

### Task State Tracking

Maintain state for each sub-issue:

| State | Description |
|-------|-------------|
| `pending` | Waiting for blockers |
| `ready` | Queued to run |
| `running` | Subagent active |
| `completed` | Finished, merged to feature branch |
| `failed` | Error encountered |
| `blocked_by_failure` | Dependency failed, cannot proceed |

### Execution Algorithm

```
Initialize:
  - ready_queue = tasks with no blockers
  - running = []
  - completed = []
  - failed = []
  - color_index = 0

While tasks remain unfinished:
  1. Pop up to N tasks from ready_queue (N = parallel limit - running.length)

  2. For each popped task:
     a. Assign color: AGENT_COLORS[color_index % 6]
     b. Increment color_index
     c. Spawn subagent (see below)
     d. Add to running list

  3. Monitor running agents (poll every 30 seconds)

  4. When a subagent completes:
     a. If SUCCESS:
        - Pull feature branch
        - Merge task branch to feature branch
        - Push feature branch
        - Mark task: completed
        - Add to completed list
        - For each task blocked by this one:
          - If all blockers completed → add to ready_queue

     b. If FAILED:
        - Mark task: failed
        - Add to failed list
        - For each task blocked by this one:
          - Mark: blocked_by_failure

  5. Repeat until ready_queue empty AND running empty
```

### Spawning Subagents

For each task to execute:

```
Task(
  subagent_type: "general-purpose",
  description: "$ISSUE_ID: $TITLE",
  prompt: """
Execute /team:task $ISSUE_ID

IMPORTANT CONTEXT:
- This is a sub-task of parent feature $PARENT_ISSUE_ID
- Branch from the feature branch: $FEATURE_BRANCH (NOT from main)
- After completing, your branch will be merged back to the feature branch
- Do NOT create a PR - the orchestrator handles merging

BRANCH INSTRUCTIONS:
1. git checkout $FEATURE_BRANCH
2. git pull origin $FEATURE_BRANCH
3. Create your task branch: feat/$ISSUE_ID-$SLUGIFIED_TITLE
4. Complete all workflow phases (brainstorm, plan, execute, quality check)
5. When done, commit and push your branch

SUCCESS SIGNAL:
When all quality gates pass and code is committed/pushed, output:
"✅ TASK COMPLETE: $ISSUE_ID - Ready for merge"

FAILURE SIGNAL:
If you cannot complete the task, output:
"❌ TASK FAILED: $ISSUE_ID - $ERROR_REASON"
""",
  run_in_background: true
)
```

### Wave Completion Updates

After each wave completes (all running tasks finish), post to Linear:

```
mcp__linear__create_comment(
  issueId: "$PARENT_ISSUE_ID",
  body: "## Wave $N Complete\n\n$WAVE_SUMMARY\n\n**Progress:** $COMPLETED/$TOTAL tasks complete"
)
```

---

## Phase 3: Progress Reporting

### Real-Time Status Line

Update status line every 30 seconds:

```
Feature $PARENT_ISSUE_ID: $DONE/$TOTAL done | $RUNNING running | $FAILED failed | $BLOCKED blocked
```

### Console Progress Table (Every 2 minutes)

```
┌─────────────────────────────────────────────────┐
│ $PARENT_ISSUE_ID Progress Update                │
├──────────┬──────────────────────────┬───────────┤
│ $ISSUE_1 │ $TITLE_1 (truncated)     │ ✅ Done   │
│ $ISSUE_2 │ $TITLE_2 (truncated)     │ 🔄 Running│
│ $ISSUE_3 │ $TITLE_3 (truncated)     │ ❌ Failed │
│ $ISSUE_4 │ $TITLE_4 (truncated)     │ ⏳ Pending│
│ $ISSUE_5 │ $TITLE_5 (truncated)     │ 🚫 Blocked│
└──────────┴──────────────────────────┴───────────┘
```

Status icons:
- ✅ Done - Task completed and merged
- 🔄 Running - Subagent active
- ❌ Failed - Error encountered
- ⏳ Pending - Waiting for blockers
- 🚫 Blocked - Dependency failed

### Failure Notification

When a task fails, immediately post to Linear:

```
mcp__linear__create_comment(
  issueId: "$PARENT_ISSUE_ID",
  body: "## ⚠️ Task Failed: $ISSUE_ID\n\n**Error:** $ERROR_SUMMARY\n\n**Blocked tasks:** $BLOCKED_LIST\n\nContinuing with independent tasks."
)
```

---

## Phase 4: Completion

### Final Summary

When all executable tasks finish (no more running, no more ready):

```
╔═══════════════════════════════════════════════════════════════╗
║  Feature Complete: $PARENT_ISSUE_ID - $PARENT_TITLE           ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ Completed ($COMPLETED_COUNT)                              ║
║     $ISSUE_1: $TITLE_1                        → merged        ║
║     $ISSUE_2: $TITLE_2                        → merged        ║
║     ...                                                       ║
║                                                               ║
║  ❌ Failed ($FAILED_COUNT)                                    ║
║     $ISSUE_X: $TITLE_X                        → $ERROR        ║
║     ...                                                       ║
║                                                               ║
║  🚫 Blocked ($BLOCKED_COUNT)                                  ║
║     $ISSUE_Y: $TITLE_Y                        → Blocked by X  ║
║     ...                                                       ║
║                                                               ║
║  Feature Branch: $FEATURE_BRANCH                              ║
╚═══════════════════════════════════════════════════════════════╝
```

### Post Summary to Linear

```
mcp__linear__create_comment(
  issueId: "$PARENT_ISSUE_ID",
  body: "## Feature Development Complete\n\n**Branch:** `$FEATURE_BRANCH`\n\n### Results\n- ✅ Completed: $COMPLETED_COUNT\n- ❌ Failed: $FAILED_COUNT\n- 🚫 Blocked: $BLOCKED_COUNT\n\n$DETAILS"
)
```

### Update Parent Status

```
# If all tasks completed:
mcp__linear__update_issue(id: "$PARENT_ISSUE_ID", state: "In Review")

# If any failures:
mcp__linear__update_issue(id: "$PARENT_ISSUE_ID", state: "Blocked")
```

### Next Action Prompt

Present options using AskUserQuestion:

```
What would you like to do?

1. Create PR from feature branch to main
   - All completed work will be in the PR
   - Failed/blocked tasks can be addressed separately

2. Retry failed tasks
   - Re-run /team:task for each failed issue
   - Will branch from current feature branch state

3. View failure details for $FAILED_ISSUE
   - Show full error output and context
   - Help diagnose the issue

4. Exit and handle manually
   - Keep feature branch as-is
   - Handle remaining work outside orchestrator
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Linear API failure | Retry 3x with exponential backoff, then halt wave |
| Git merge conflict | Mark task failed, continue others, report in summary |
| Subagent timeout | Mark task failed after 30 minutes, continue others |
| All tasks blocked | Report deadlock, exit with summary |
| Feature branch push fails | Halt wave, prompt user to resolve |

## Merge Conflict Resolution

If merging a task branch to feature branch conflicts:

1. Abort the merge: `git merge --abort`
2. Mark task as `failed` with reason: "Merge conflict with feature branch"
3. Include in failure details: conflicting files
4. Continue with other independent tasks
5. User can resolve manually after orchestration completes

---

## Implementation Notes

### Subagent Communication

Subagents run `/team:task` but with modifications:
- Branch from feature branch (not main)
- Skip PR creation (orchestrator handles merging)
- Output completion/failure signal for orchestrator to detect

### Merge Coordination

The orchestrator MUST:
1. Wait for subagent completion (background task completes)
2. Pull latest feature branch
3. Checkout task branch
4. Merge task branch to feature branch
5. Push feature branch
6. Only then mark blockers as satisfied

### State Persistence

Track orchestrator state in memory during execution:
- Current wave number
- Task states (pending/ready/running/completed/failed/blocked)
- Running agent task IDs
- Completed merges
- Failed tasks with errors

If orchestrator is interrupted, Linear comments provide recovery context.
