# /ideate:plan

Create a detailed implementation plan from a validated design.

## Prerequisites

Requires `pressure-test.md` with sign-off in the current feature directory.

If not found:
```
❌ ERROR: No validated design found.
Run /ideate:pressure-test first.
```

If found but no sign-off:
```
❌ ERROR: Design not signed off.
Complete /ideate:pressure-test with sign-off first.
```

## Process

### Step 1: Load validated design

Read `$FEATURE_DIR/design.md` and `$FEATURE_DIR/pressure-test.md`

Extract:
- Feature description
- Essential scope (post-YAGNI)
- Technical approach
- Edge cases to handle

### Step 2: Invoke superpowers:writing-plans

```
Invoke the superpowers:writing-plans skill.
Provide it with the validated design context.
Let it create a detailed implementation plan.
```

### Step 3: Save plan artifact

Write the plan output to `$FEATURE_DIR/plan.md`:

```markdown
# Implementation Plan: $FEATURE_NAME

**Date:** $DATE
**Based on:** design.md (validated via pressure-test.md)

[Captured output from superpowers:writing-plans]
```

### Step 4: Announce completion

```
✅ Plan Complete

Implementation plan saved to: $FEATURE_DIR/plan.md

Next: Run /ideate:stories to break into Linear stories.
```

## Resumability

If `$FEATURE_DIR/plan.md` already exists:

Ask: "plan.md already exists. Overwrite? [y/N]"

## Error Handling

| Error | Action |
|-------|--------|
| pressure-test.md not found | Error: Run /ideate:pressure-test first |
| No sign-off in pressure-test | Error: Complete pressure test with sign-off |
| superpowers plugin missing | Error with install instructions, halt |
