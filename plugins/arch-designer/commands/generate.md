# /arch:generate

Scan the codebase and generate a full architecture diagram suite.

## What It Does

1. Analyzes infrastructure-as-code (Terraform, CDK, CloudFormation, Kubernetes, Docker, Serverless)
2. Scans application code for service connections, API routes, database usage
3. Builds an architecture graph model
4. Generates multiple diagram views:
   - **Overview** - High-level system architecture
   - **Data Flow** - How data moves through the system
   - **Infrastructure** - AWS/cloud resources and networking
   - **Per-Service** - Detailed view of each major service

## Output

Diagrams are saved to `docs/architecture/latest/`:
- `overview.svg` - Animated SVG
- `overview.png` - Static image
- `data-flow.svg`
- `infrastructure.svg`
- `embed.html` - Copy-paste snippet for README

## Usage

/arch:generate

## Execution Steps

1. **Scan codebase** - Run all analyzers to discover architecture
2. **Build graph** - Construct nodes, edges, and groupings
3. **Auto-layout** - Apply dagre.js layout algorithm
4. **Render views** - Generate SVG for each view type
5. **Export formats** - Create PNG, HTML embed versions
6. **Report** - Display summary of discovered components

## After Generation

You can refine interactively:
- "Zoom into the auth flow"
- "Add a callout explaining the cache layer"
- "Move the database to the right"
