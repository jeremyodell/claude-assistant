# /ideate:pressure-test

Validate a design through mandatory pressure testing before planning.

## Prerequisites

Requires `design.md` in the current feature directory.

If not found:
```
❌ ERROR: No design found.
Run /ideate:brainstorm "your idea" first.
```

## Process

### Step 1: Load design and original idea

Read `$FEATURE_DIR/design.md`
Extract the original idea from the file header.

### Step 2: Scope Drift Check

Compare the design back to the original idea.

```
## Scope Drift Check

Original idea: "$ORIGINAL_IDEA"

The design includes:
```

For each major component/feature in the design:
- Mark with ✓ if it directly solves the original problem
- Mark with ? if connection is unclear
- Mark with ✗ if it doesn't trace to original problem

```
✓ [Component] → directly addresses original problem
? [Component] → connection unclear - justify or remove
✗ [Component] → scope creep - remove or defer
```

For each ? or ✗ item, ask user to justify or confirm removal.

Capture responses.

### Step 3: Assumption Challenge

Extract 3-5 key assumptions from the design.

For each assumption:
```
Assumption: "[Extracted assumption]"
Challenge: [Why might this be wrong? What's the alternative?]

Your response:
```

Capture user responses.

### Step 4: Risk Identification

Surface potential risks:

```
## Risks Identified

| Risk | Severity | Mitigation |
|------|----------|------------|
| [Technical risk] | High/Med/Low | [User input] |
| [External dependency] | High/Med/Low | [User input] |
| [Unknown area] | High/Med/Low | [User input] |
```

Ask user to acknowledge each risk or provide mitigation.

### Step 5: YAGNI Check

List features/complexity from the design:

```
## YAGNI Check

Is each item essential for v1, or can it be deferred?

1. [Feature/complexity] → Essential / Defer
2. [Feature/complexity] → Essential / Defer
3. [Feature/complexity] → Essential / Defer
```

Present as multiple choice. Deferred items are logged but removed from scope.

### Step 6: Edge Cases

Prompt for failure modes:

```
## Edge Cases

Consider these failure scenarios:

1. What happens if [relevant failure mode]?
2. What happens if [performance edge case]?
3. What happens if [partial deployment]?

Your responses:
```

Capture responses.

### Step 7: Sign-off

```
## Sign-off Required

The design:
- Solves the original problem: "$ORIGINAL_IDEA"
- Has [N] acknowledged risks with mitigations
- Deferred [M] items to future versions
- Addresses [K] edge cases

Do you confirm this design is validated and ready for planning? [y/N]
```

If No: Ask what needs to change, return to relevant step.
If Yes: Proceed to save.

### Step 8: Save pressure test artifact

Write to `$FEATURE_DIR/pressure-test.md`:

```markdown
# Pressure Test: $FEATURE_NAME

**Date:** $DATE
**Sign-off:** Confirmed
**Timestamp:** $TIMESTAMP

## Original Idea
$ORIGINAL_IDEA

## Scope Drift Check
[Captured decisions]

## Assumptions Challenged
[Captured responses]

## Risks & Mitigations
[Risk table with mitigations]

## YAGNI Decisions
- Essential: [list]
- Deferred: [list]

## Edge Cases
[Captured responses]
```

### Step 9: Announce completion

```
✅ Pressure Test Complete

Validated design saved to: $FEATURE_DIR/pressure-test.md
- Scope drift: Resolved
- Assumptions: [N] challenged
- Risks: [N] with mitigations
- Deferred: [N] items
- Edge cases: [N] addressed

Next: Run /ideate:plan to create implementation plan.
```

## Error Handling

| Error | Action |
|-------|--------|
| design.md not found | Error: Run /ideate:brainstorm first |
| User rejects sign-off | Return to relevant step for revision |
| User abandons | Partial progress lost (no artifact until sign-off) |
