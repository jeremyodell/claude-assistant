# /team:ship

Create a pull request after passing all quality gates, update Linear status, and link PR.

## Pre-flight Checks

### 1. Verify Branch

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

**Block if:**
- On `main` or `master` branch
- Not on a `feat/` branch

**Error message:**
```
❌ Cannot ship from branch: $CURRENT_BRANCH
Must be on a feature branch (feat/ISSUE-ID-description)
```

### 2. Verify Quality Gates

Run all quality gates internally:

```bash
npm test
npm run lint  
npm run typecheck
```

And run `/code-review`

**Block if any gate fails.** Display:
```
❌ QUALITY GATES FAILED - Cannot create PR

Run /team:quality-check for details
```

---

## Ship Process

### Step 1: Stage Changes

```bash
git add -A
```

### Step 2: Create Commit

Extract issue ID from branch name:
```bash
ISSUE_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[A-Z]+-[0-9]+')
```

Create conventional commit:
```bash
git commit -m "feat($ISSUE_ID): <brief description>

- <bullet point of main change>
- <bullet point of secondary change>

Closes $ISSUE_ID"
```

**Commit message rules:**
- Type: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Scope: Linear issue ID
- Description: imperative mood, < 72 chars
- Body: bullet list of changes
- Footer: `Closes $ISSUE_ID`

### Step 3: Push Branch

```bash
git push -u origin "$CURRENT_BRANCH"
```

### Step 4: Create Pull Request

```bash
gh pr create \
  --title "feat($ISSUE_ID): <description>" \
  --body "## Summary

<Brief description of changes>

## Changes

- <Change 1>
- <Change 2>

## Testing

- [x] Unit tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Code review clean

## Linear

Closes $ISSUE_ID

---
*Created via team-workflow plugin*" \
  --head "$CURRENT_BRANCH" \
  --base main
```

Extract PR URL from output.

### Step 5: Update Linear Status

```
mcp__linear__update_issue(
  issueId: "$ISSUE_ID",
  stateId: <in_review_state_id>
)
```

Note: Query workflow states to find "In Review" state ID if unknown.

### Step 6: Post PR Link to Linear

```
mcp__linear__create_comment(
  issueId: "$ISSUE_ID",
  body: "## Pull Request Created\n\n🔗 $PR_URL\n\nReady for review."
)
```

---

## Success Output

```
✅ SHIPPED SUCCESSFULLY

Branch:     $CURRENT_BRANCH
Commit:     $COMMIT_SHA
PR:         $PR_URL
Linear:     Updated to "In Review"

Next steps:
1. Request review from team members
2. Address review feedback
3. Merge when approved
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Not on feature branch | Block with instructions |
| Quality gates fail | Block, show failures |
| Git push fails | Show error, suggest `git pull --rebase` |
| PR creation fails | Show error, suggest manual creation |
| Linear API fails | Continue but warn, suggest manual update |
| No changes to commit | Warn but allow PR if branch has commits |

---

## Rollback

If ship fails mid-process:

1. **Commit created but push failed:**
   ```bash
   git reset --soft HEAD~1
   ```

2. **Push succeeded but PR failed:**
   - Suggest manual PR creation via `gh pr create`

3. **PR created but Linear failed:**
   - Provide Linear update instructions
   - PR is still valid

---

## Dependencies

Required tools:
- `git` - version control
- `gh` - GitHub CLI (authenticated)
- Linear MCP server (for status updates)

Check dependencies at start:
```bash
command -v git >/dev/null || echo "git not found"
command -v gh >/dev/null || echo "gh not found"
gh auth status >/dev/null 2>&1 || echo "gh not authenticated"
```
