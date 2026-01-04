# Arch Designer

Code-first architecture diagramming plugin for Claude Code. Generates ByteByteGo-quality diagrams from your codebase.

## Features

- **Auto-discovery** - Scans Terraform, Docker Compose, and more to find your architecture
- **Professional styling** - ByteByteGo-inspired color palette with semantic component colors
- **Animated SVGs** - Flow indicators show data movement through your system
- **Multiple views** - Overview, data flow, infrastructure, and per-service diagrams
- **Pitch deck generation** - Create investor or client presentations with auto-generated diagrams

## Installation

Copy or symlink this plugin to your Claude Code plugins directory:

```bash
cp -r plugins/arch-designer ~/.claude/plugins/
```

Or add to your project's local plugins:

```bash
mkdir -p .claude/plugins
cp -r plugins/arch-designer .claude/plugins/
```

## Quick Start

### Using Commands

```
/arch:generate          # Scan codebase and generate diagrams
/arch:view auth-flow    # Generate focused view of specific component
/arch:export --social   # Export for social media sharing
/arch:refresh           # Regenerate after code changes
```

### Using the API

```typescript
import { generateArchitecture } from 'arch-designer';

const result = await generateArchitecture('./my-project');

// result.svg - Animated SVG string
// result.graph - Architecture graph model
// result.layout - Positioned nodes and edges

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('docs/architecture.svg', result.svg);
```

## Supported Sources

| Source | Status | Components Extracted |
|--------|--------|---------------------|
| Terraform | Supported | Lambda, DynamoDB, S3, SQS, SNS, API Gateway, VPC |
| Docker Compose | Supported | Services, dependencies, databases, caches |
| Kubernetes | Planned | Deployments, services, ingress |
| AWS CDK | Planned | All CDK constructs |
| CloudFormation | Planned | All CF resources |
| Application Code | Planned | Express routes, database connections |

## Output Structure

Diagrams are saved to `docs/architecture/latest/`:

```
docs/architecture/latest/
├── overview.svg          # Main architecture diagram (animated)
├── overview.png          # Static image version
├── data-flow.svg         # Data flow diagram
├── infrastructure.svg    # Infrastructure view
└── embed.html            # Copy-paste for README
```

## Component Colors

The plugin uses a semantic color palette:

| Component Type | Color | Meaning |
|---------------|-------|---------|
| Frontend | Blue | Trust, stability |
| API Gateway | Purple | Orchestration |
| Compute | Green | Action, processing |
| Database | Orange | Data, persistence |
| Cache | Light Blue | Speed, ephemeral |
| Storage | Amber | Files, objects |
| Queue | Gold | Async messaging |
| Stream | Teal | Continuous flow |
| Auth | Red | Security, critical |
| External | Gray | Third-party |

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Analyzers  │ -> │ GraphBuilder │ -> │   Dagre     │ -> │ SVG Renderer │
│             │    │              │    │   Layout    │    │              │
│ - Terraform │    │ Merge nodes, │    │ Position    │    │ Animated SVG │
│ - Docker    │    │ edges, groups│    │ nodes/edges │    │ with styling │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

## API Reference

### `generateArchitecture(projectPath, options?)`

Main convenience function that runs the full pipeline.

```typescript
interface GenerateOptions {
  projectName?: string;  // Override project name
  animate?: boolean;     // Enable flow animation (default: true)
}

interface GenerateResult {
  graph: ArchitectureGraph;  // The graph model
  layout: LayoutResult;      // Positioned nodes/edges
  svg: string;               // Rendered SVG string
}
```

### `GraphBuilder`

Build architecture graphs programmatically:

```typescript
import { GraphBuilder } from 'arch-designer';

const builder = new GraphBuilder('my-project');

builder.addNode({
  id: 'api',
  name: 'API Gateway',
  type: 'api',
  provider: 'aws',
  service: 'apigateway',
  metadata: {}
});

builder.addEdge({
  id: 'api-to-lambda',
  from: 'api',
  to: 'handler',
  type: 'invoke'
});

const graph = builder.build();
```

### `layoutGraph(graph)`

Apply dagre layout to position nodes:

```typescript
import { layoutGraph } from 'arch-designer';

const layout = layoutGraph(graph);
// layout.nodes - PositionedNode[] with x, y, width, height
// layout.edges - PositionedEdge[] with points array
```

### `renderToSvg(layout, options?)`

Render positioned layout to SVG:

```typescript
import { renderToSvg } from 'arch-designer';

const svg = renderToSvg(layout, {
  width: 1200,
  height: 800,
  animate: true,
  padding: 40
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT
