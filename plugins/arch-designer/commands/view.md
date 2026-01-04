# /arch:view $SCOPE

Generate a custom scoped architecture diagram.

## Arguments

- `$SCOPE`: What to visualize (e.g., `auth-flow`, `payment-service`, `data-pipeline`)

## Usage

/arch:view auth-flow
/arch:view payment-service --include-dependencies
/arch:view api-gateway

## Execution Steps

1. **Parse scope** - Identify which components to include
2. **Filter graph** - Extract relevant nodes and connections
3. **Auto-layout** - Apply dagre.js to filtered graph
4. **Render** - Generate SVG with focused view
5. **Export** - Save to `docs/architecture/latest/{scope}.svg`
