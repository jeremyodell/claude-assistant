#!/bin/bash
#
# verify-before-stop.sh
# Runs quality checks before Claude Code stops execution
# Ensures code quality is maintained even if workflow is interrupted
#

set -e

echo "🔍 Running pre-stop verification..."
echo ""

# Track overall status
FAILED=0

# Check for uncommitted changes (warn only)
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    echo "⚠️  WARNING: Uncommitted changes detected"
    echo "   Consider committing your work before stopping"
    echo ""
fi

# Check for untracked files (warn only)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | head -5)
if [ -n "$UNTRACKED" ]; then
    echo "⚠️  WARNING: Untracked files detected:"
    echo "$UNTRACKED" | sed 's/^/   /'
    if [ "$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)" -gt 5 ]; then
        echo "   ... and more"
    fi
    echo ""
fi

# Run tests
echo "📋 Running tests..."
if npm test 2>&1; then
    echo "✅ Tests passed"
else
    echo "❌ Tests FAILED"
    FAILED=1
fi
echo ""

# Run linting
echo "📋 Running linter..."
if npm run lint 2>&1; then
    echo "✅ Linting passed"
else
    echo "❌ Linting FAILED"
    FAILED=1
fi
echo ""

# Run type checking
echo "📋 Running type checker..."
if npm run typecheck 2>&1; then
    echo "✅ Type check passed"
else
    echo "❌ Type check FAILED"
    FAILED=1
fi
echo ""

# Final status
if [ $FAILED -eq 1 ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "❌ PRE-STOP VERIFICATION FAILED"
    echo ""
    echo "Quality issues must be resolved before stopping."
    echo "Fix the issues above and try again."
    echo "═══════════════════════════════════════════════════════"
    exit 1
else
    echo "═══════════════════════════════════════════════════════"
    echo "✅ PRE-STOP VERIFICATION PASSED"
    echo ""
    echo "All quality gates passed. Safe to stop."
    echo "═══════════════════════════════════════════════════════"
    exit 0
fi
