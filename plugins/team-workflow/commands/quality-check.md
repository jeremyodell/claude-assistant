# /team:quality-check

Run all quality gates and report status. This command blocks PR creation if any gate fails.

## Quality Gates

Execute each gate sequentially. Collect ALL results before reporting.

### Gate 1: Tests

```bash
npm test 2>&1
```

**Pass criteria:** Exit code 0, ZERO test failures
**Failure output:** List each failing test with file, test name, and error message

### Gate 2: Linting

```bash
npm run lint 2>&1
```

**Pass criteria:** Exit code 0, ZERO errors (warnings are acceptable)
**Failure output:** List each error with file:line and rule violated

### Gate 3: Type Checking

```bash
npm run typecheck 2>&1
```

**Pass criteria:** Exit code 0, ZERO type errors
**Failure output:** List each error with file:line and type mismatch details

### Gate 4: Code Review

```
/code-review
```

**Pass criteria:** ZERO issues with confidence ≥ 80%
**Failure output:** List each high-confidence issue with file:line and description

---

## Output Format

Generate a status table:

```
╔═══════════════════════════════════════════════════════════════╗
║                    QUALITY GATE STATUS                        ║
╠═══════════════════════════════════════════════════════════════╣
║ Gate                  │ Status │ Details                      ║
╠═══════════════════════════════════════════════════════════════╣
║ Tests                 │ ✅/❌  │ X passing, Y failed          ║
║ Linting               │ ✅/❌  │ X errors, Y warnings         ║
║ Type Checking         │ ✅/❌  │ X errors                     ║
║ Code Review           │ ✅/❌  │ X high-confidence issues     ║
╠═══════════════════════════════════════════════════════════════╣
║ OVERALL               │ ✅/❌  │                              ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## On Failure

If ANY gate fails:

1. **List specific failures**
   ```
   ❌ FAILURES DETECTED
   
   ## Tests (2 failures)
   - src/utils.test.ts:45 - "should handle empty input"
     Expected: [], Received: undefined
   - src/api.test.ts:78 - "should retry on timeout"
     Timeout after 5000ms
   
   ## Linting (1 error)
   - src/index.ts:23:5 - @typescript-eslint/no-unused-vars
     'config' is defined but never used
   
   ## Type Errors (1 error)  
   - src/service.ts:56:10
     Type 'string' is not assignable to type 'number'
   
   ## Code Review (1 high-confidence issue)
   - src/handler.ts:89 (confidence: 85%)
     Potential SQL injection vulnerability
   ```

2. **Provide fix instructions**
   For each failure, suggest the fix approach

3. **Block state**
   ```
   ❌ QUALITY GATES FAILED
   
   Fix the issues above before proceeding.
   Run /team:quality-check again after fixes.
   
   PR CREATION BLOCKED
   ```

4. **Do NOT proceed** with PR creation

---

## On Success

If ALL gates pass:

```
✅ ALL QUALITY GATES PASSED

Tests:        42 passing
Linting:      0 errors, 3 warnings
Type Check:   Clean
Code Review:  0 high-confidence issues

Ready for PR creation. Run /team:ship to proceed.
```

---

## Retry Behavior

- If a command fails to execute (not fail gate), retry up to 3 times
- If npm scripts don't exist, note the missing script and fail that gate
- If `/code-review` is unavailable, skip that gate with warning

## Performance

- Run gates in parallel where possible
- Timeout individual gates after 5 minutes
- Display progress indicator for long-running gates
