# Team Workflow Rules

This project uses the `team-workflow` plugin to enforce consistent, high-quality development practices.

## Mandatory Workflow

All development work MUST follow this sequence:

```
1. /team:task ENG-XXX     → Start work on an issue
2. Brainstorm             → Design thinking (approval required)
3. Plan                   → Task breakdown (approval required)
4. Execute                → TDD implementation
5. /team:quality-check    → Verify all gates pass
6. /team:ship             → Create PR and update Linear
```

**Do not skip phases. Do not proceed if blocked.**

## Quality Gate Requirements

ALL gates must pass with **ZERO errors** before shipping:

| Gate | Requirement |
|------|-------------|
| Tests | `npm test` - 0 failures |
| Lint | `npm run lint` - 0 errors |
| Types | `npm run typecheck` - 0 errors |
| Review | `/code-review` - 0 issues ≥80% confidence |

**Zero tolerance. No exceptions.**

## TDD Rules

> **There is NO change too small for TDD.**

Every code change requires:
1. **Write test first** - Test must fail before implementation
2. **Implement minimum** - Only what's needed to pass
3. **Refactor** - Clean up after green
4. **Verify** - Run full test suite

### Test-First Examples

```typescript
// ❌ WRONG: Implementation without test
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ CORRECT: Test first
describe('calculateTotal', () => {
  it('sums item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
  
  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
// THEN implement
```

## Git Workflow

### Branch Naming
```
feat/ENG-123-add-user-authentication
fix/ENG-456-resolve-login-bug
refactor/ENG-789-extract-api-client
```

### Commit Messages

Use conventional commits with Linear ID:

```
feat(ENG-123): add user authentication

- Implement JWT token generation
- Add password hashing with bcrypt
- Create login/logout endpoints

Closes ENG-123
```

**Commit types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Workflow Violations

The following are **workflow violations** and must be avoided:

### ❌ Violations

1. **Skipping phases** - Every issue goes through all phases
2. **Implementing without tests** - Tests come FIRST
3. **Shipping with failures** - All gates must pass
4. **Manual commits** - Use `/team:ship` command
5. **Ignoring code review** - Address all high-confidence issues
6. **Working without Linear** - All work ties to an issue
7. **Pushing to main** - Always use feature branches
8. **Partial implementations** - Complete the full workflow

### ✅ Correct Behavior

1. Start every task with `/team:task ENG-XXX`
2. Get brainstorm approval before planning
3. Get plan approval before executing
4. Write tests before implementation
5. Run `/team:quality-check` before shipping
6. Use `/team:ship` to create PRs
7. All Linear comments are automated

## Linear Integration

The workflow automatically:
- Fetches issue details at start
- Updates status to "In Progress"
- Posts design summary as comment
- Posts implementation plan as comment
- Updates status to "In Review" on PR
- Posts PR link as comment

**All Linear updates are handled by the workflow. Do not manually update.**

## Hooks

The plugin enforces quality through hooks:

| Event | Action |
|-------|--------|
| File saved | Auto-format with Prettier |
| Before push | Run tests and lint |
| Before stop | Verify all quality gates |

**Hooks cannot be bypassed.** They prevent quality regressions.

## Getting Help

- `/team:task ENG-XXX` - Start the workflow
- `/team:quality-check` - Check gate status
- `/team:ship` - Create PR

For issues with the workflow, check:
1. Linear MCP is connected
2. GitHub CLI (`gh`) is authenticated
3. npm scripts exist (`test`, `lint`, `typecheck`)
