# Arch Designer Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a code-first architecture diagramming plugin that scans codebases and generates ByteByteGo-quality diagrams and pitch decks.

**Architecture:** Plugin uses analyzers to scan IaC/app code → builds a graph model → layouts with dagre.js → renders with D3.js/SVG → exports to multiple formats. Pitch decks combine auto-generated diagrams with user-provided content via Reveal.js/Marp.

**Tech Stack:** TypeScript, D3.js, dagre, Puppeteer, Reveal.js, Marp

---

## Phase 1: Plugin Scaffold

### Task 1.1: Create Plugin Directory Structure

**Files:**
- Create: `plugins/arch-designer/.claude-plugin/plugin.json`
- Create: `plugins/arch-designer/package.json`
- Create: `plugins/arch-designer/tsconfig.json`

**Step 1: Create plugin.json**

```json
{
  "name": "arch-designer",
  "version": "1.0.0",
  "description": "Code-first architecture diagramming with ByteByteGo-quality visuals and pitch deck generation",
  "author": {
    "name": "Jeremy Odell"
  },
  "license": "MIT",
  "keywords": [
    "architecture",
    "diagrams",
    "bytebytego",
    "aws",
    "infrastructure",
    "pitch-deck",
    "visualization"
  ]
}
```

**Step 2: Create package.json**

```json
{
  "name": "arch-designer",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "d3": "^7.8.5",
    "dagre": "^0.8.5",
    "puppeteer": "^21.0.0",
    "@marp-team/marp-core": "^3.9.0"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/dagre": "^0.7.52",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create directory structure**

Run: `mkdir -p plugins/arch-designer/{commands,skills/arch-designer,hooks,src/{analyzers,graph,layout,renderers,templates},assets/icons}`

**Step 5: Commit scaffold**

Run: `git add plugins/arch-designer/ && git commit -m "feat(arch-designer): scaffold plugin structure"`

---

### Task 1.2: Create Command Stubs

**Files:**
- Create: `plugins/arch-designer/commands/generate.md`
- Create: `plugins/arch-designer/commands/view.md`
- Create: `plugins/arch-designer/commands/deck.md`
- Create: `plugins/arch-designer/commands/export.md`
- Create: `plugins/arch-designer/commands/refresh.md`

**Step 1: Create generate.md**

```markdown
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
```

**Step 2: Create view.md**

```markdown
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
```

**Step 3: Create deck.md**

```markdown
# /arch:deck $TYPE

Generate a pitch deck with architecture diagrams.

## Arguments

- `$TYPE`: Deck type - `--investor` or `--client`

## Usage

/arch:deck --investor
/arch:deck --client

## Investor Deck Structure

| Slide | Content | Source |
|-------|---------|--------|
| Title | Company name, tagline | User input |
| Problem | Pain point you solve | User input |
| Solution | Overview diagram | Auto-generated |
| How It Works | Animated data flow | Auto-generated |
| Market Size | TAM/SAM/SOM | User input |
| Business Model | Revenue model | User input |
| Traction | Metrics, growth | User input |
| Architecture | Full system diagram | Auto-generated |
| Competition | Market positioning | User input |
| Team | Founder bios | User input |
| The Ask | Funding request | User input |

## Client Deck Structure

| Slide | Content | Source |
|-------|---------|--------|
| Title | Company name, tagline | User input |
| Their Problem | Client pain points | User input |
| Solution | Overview diagram | Auto-generated |
| How It Works | Simple flow | Auto-generated |
| Architecture | Trust/reliability view | Auto-generated |
| Case Study | Client results | User input |
| Security | Security diagram | Auto-generated |
| Integration | Integration points | Auto-generated |
| Pricing | Pricing tiers | User input |
| Next Steps | CTA | User input |

## Execution Steps

1. **Generate diagrams** - Run /arch:generate if not already done
2. **Prompt for content** - Ask user for each manual slide
3. **Build deck** - Combine diagrams with user content
4. **Export formats** - HTML (Reveal.js), PDF, PPTX

## Output

Decks saved to `docs/architecture/decks/`:
- `investor-deck.html` - Interactive web presentation
- `investor-deck.pdf` - Static export
- `investor-deck.pptx` - Editable PowerPoint
```

**Step 4: Create export.md**

```markdown
# /arch:export $OPTIONS

Export diagrams in multiple formats.

## Options

- `--social` - Export social media sized images
- `--all` - Export all formats (default)
- `--format=<type>` - Specific format (svg, png, pdf, html)

## Usage

/arch:export
/arch:export --social
/arch:export --format=png

## Social Media Export

Creates platform-optimized images:
- `linkedin-post.png` (1200x627)
- `twitter-post.png` (1600x900)
- `instagram-square.png` (1080x1080)
- `suggested-caption.md` - AI-generated post text

## Output Location

All exports go to `docs/architecture/latest/`
```

**Step 5: Create refresh.md**

```markdown
# /arch:refresh

Regenerate architecture diagrams from current codebase.

## Usage

/arch:refresh

## When to Use

- After making infrastructure changes
- When diagrams are stale
- Before a presentation

## Execution

Equivalent to running `/arch:generate` but skips re-prompting for deck content.
```

**Step 6: Commit commands**

Run: `git add plugins/arch-designer/commands/ && git commit -m "feat(arch-designer): add command definitions"`

---

## Phase 2: Graph Model

### Task 2.1: Define TypeScript Types

**Files:**
- Create: `plugins/arch-designer/src/graph/types.ts`
- Test: `plugins/arch-designer/src/graph/types.test.ts`

**Step 1: Write the type definitions test**

```typescript
// src/graph/types.test.ts
import { describe, it, expect } from 'vitest';
import type {
  Component,
  Connection,
  LogicalGroup,
  ArchitectureGraph,
  ComponentType,
  ConnectionType,
  GroupType,
  Provider
} from './types';

describe('Graph Types', () => {
  it('should create a valid Component', () => {
    const component: Component = {
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'api',
      provider: 'aws',
      service: 'apigateway',
      metadata: {
        region: 'us-east-1'
      }
    };

    expect(component.id).toBe('api-gateway');
    expect(component.type).toBe('api');
    expect(component.provider).toBe('aws');
  });

  it('should create a valid Connection', () => {
    const connection: Connection = {
      id: 'api-to-lambda',
      from: 'api-gateway',
      to: 'lambda-handler',
      type: 'invoke',
      protocol: 'https',
      label: 'REST API'
    };

    expect(connection.from).toBe('api-gateway');
    expect(connection.to).toBe('lambda-handler');
  });

  it('should create a valid LogicalGroup', () => {
    const group: LogicalGroup = {
      id: 'vpc-main',
      name: 'Production VPC',
      type: 'vpc',
      children: ['subnet-public', 'subnet-private'],
      metadata: {
        cidr: '10.0.0.0/16'
      }
    };

    expect(group.children).toHaveLength(2);
  });

  it('should create a valid ArchitectureGraph', () => {
    const graph: ArchitectureGraph = {
      nodes: [],
      edges: [],
      groups: [],
      metadata: {
        projectName: 'my-app',
        techStack: ['typescript', 'aws'],
        cloudProvider: 'aws',
        analyzedAt: new Date().toISOString()
      }
    };

    expect(graph.metadata.projectName).toBe('my-app');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd plugins/arch-designer && npm install && npm test`
Expected: FAIL - types.ts does not exist

**Step 3: Write the type definitions**

```typescript
// src/graph/types.ts

export type Provider = 'aws' | 'gcp' | 'azure' | 'generic';

export type ComponentType =
  | 'frontend'      // React, Vue, mobile apps
  | 'api'           // API Gateway, Load Balancer
  | 'compute'       // Lambda, ECS, EC2
  | 'database'      // DynamoDB, RDS, PostgreSQL
  | 'cache'         // Redis, ElastiCache
  | 'storage'       // S3, EFS
  | 'queue'         // SQS, SNS, EventBridge
  | 'stream'        // Kinesis, Kafka
  | 'cdn'           // CloudFront
  | 'auth'          // Cognito, Auth0
  | 'monitoring'    // CloudWatch, Datadog
  | 'external'      // Third-party APIs
  | 'user';         // End users

export type ConnectionType =
  | 'http'          // REST API calls
  | 'grpc'          // gRPC calls
  | 'graphql'       // GraphQL queries
  | 'websocket'     // WebSocket connections
  | 'invoke'        // Direct invocation (Lambda)
  | 'query'         // Database queries
  | 'publish'       // Queue/topic publish
  | 'subscribe'     // Queue/topic subscribe
  | 'event'         // Event emission
  | 'stream'        // Data streaming
  | 'sync';         // File/data sync

export type GroupType =
  | 'vpc'           // AWS VPC
  | 'subnet'        // Network subnet
  | 'region'        // Cloud region
  | 'az'            // Availability zone
  | 'cluster'       // Container cluster
  | 'namespace'     // Kubernetes namespace
  | 'service-boundary'  // Logical service grouping
  | 'security-group';   // Security boundary

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  provider?: Provider;
  service?: string;       // e.g., 'lambda', 'dynamodb', 'sqs'
  metadata: Record<string, unknown>;
}

export interface Connection {
  id: string;
  from: string;           // Component ID
  to: string;             // Component ID
  type: ConnectionType;
  protocol?: string;      // e.g., 'https', 'tcp'
  label?: string;         // Display label
  metadata?: Record<string, unknown>;
}

export interface LogicalGroup {
  id: string;
  name: string;
  type: GroupType;
  children: string[];     // Component or Group IDs
  parent?: string;        // Parent group ID
  metadata?: Record<string, unknown>;
}

export interface ProjectMetadata {
  projectName: string;
  techStack: string[];
  cloudProvider?: Provider;
  analyzedAt: string;     // ISO timestamp
  sourceFiles?: string[]; // Files that were analyzed
}

export interface ArchitectureGraph {
  nodes: Component[];
  edges: Connection[];
  groups: LogicalGroup[];
  metadata: ProjectMetadata;
}

// Helper type for analyzer results
export interface AnalyzerResult {
  nodes: Component[];
  edges: Connection[];
  groups: LogicalGroup[];
  sourceFiles: string[];
}
```

**Step 4: Run test to verify it passes**

Run: `cd plugins/arch-designer && npm test`
Expected: PASS

**Step 5: Commit**

Run: `git add plugins/arch-designer/src/graph/ && git commit -m "feat(arch-designer): add graph type definitions"`

---

### Task 2.2: Create Graph Builder

**Files:**
- Create: `plugins/arch-designer/src/graph/builder.ts`
- Test: `plugins/arch-designer/src/graph/builder.test.ts`

**Step 1: Write the failing test**

```typescript
// src/graph/builder.test.ts
import { describe, it, expect } from 'vitest';
import { GraphBuilder } from './builder';
import type { AnalyzerResult, Component, Connection } from './types';

describe('GraphBuilder', () => {
  it('should create an empty graph', () => {
    const builder = new GraphBuilder('test-project');
    const graph = builder.build();

    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(graph.metadata.projectName).toBe('test-project');
  });

  it('should merge analyzer results', () => {
    const builder = new GraphBuilder('test-project');

    const terraformResult: AnalyzerResult = {
      nodes: [
        { id: 'lambda-1', name: 'Handler', type: 'compute', provider: 'aws', service: 'lambda', metadata: {} }
      ],
      edges: [],
      groups: [],
      sourceFiles: ['main.tf']
    };

    const appResult: AnalyzerResult = {
      nodes: [
        { id: 'db-1', name: 'Users DB', type: 'database', provider: 'aws', service: 'dynamodb', metadata: {} }
      ],
      edges: [
        { id: 'e1', from: 'lambda-1', to: 'db-1', type: 'query' }
      ],
      groups: [],
      sourceFiles: ['handler.ts']
    };

    builder.merge(terraformResult);
    builder.merge(appResult);

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.metadata.sourceFiles).toContain('main.tf');
    expect(graph.metadata.sourceFiles).toContain('handler.ts');
  });

  it('should deduplicate nodes by id', () => {
    const builder = new GraphBuilder('test-project');

    const result1: AnalyzerResult = {
      nodes: [{ id: 'svc-1', name: 'Service', type: 'compute', metadata: {} }],
      edges: [],
      groups: [],
      sourceFiles: []
    };

    const result2: AnalyzerResult = {
      nodes: [{ id: 'svc-1', name: 'Service Updated', type: 'compute', metadata: { extra: true } }],
      edges: [],
      groups: [],
      sourceFiles: []
    };

    builder.merge(result1);
    builder.merge(result2);

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].name).toBe('Service Updated'); // Later wins
  });

  it('should add nodes and edges manually', () => {
    const builder = new GraphBuilder('test-project');

    builder.addNode({
      id: 'user',
      name: 'User',
      type: 'user',
      metadata: {}
    });

    builder.addEdge({
      id: 'user-to-api',
      from: 'user',
      to: 'api',
      type: 'http'
    });

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd plugins/arch-designer && npm test`
Expected: FAIL - builder.ts does not exist

**Step 3: Write the implementation**

```typescript
// src/graph/builder.ts
import type {
  ArchitectureGraph,
  AnalyzerResult,
  Component,
  Connection,
  LogicalGroup,
  ProjectMetadata,
  Provider
} from './types';

export class GraphBuilder {
  private nodes: Map<string, Component> = new Map();
  private edges: Map<string, Connection> = new Map();
  private groups: Map<string, LogicalGroup> = new Map();
  private sourceFiles: Set<string> = new Set();
  private techStack: Set<string> = new Set();
  private cloudProvider?: Provider;

  constructor(private projectName: string) {}

  merge(result: AnalyzerResult): void {
    // Merge nodes (later overwrites earlier)
    for (const node of result.nodes) {
      this.nodes.set(node.id, node);
      if (node.provider) {
        this.cloudProvider = node.provider;
      }
      if (node.service) {
        this.techStack.add(node.service);
      }
    }

    // Merge edges
    for (const edge of result.edges) {
      this.edges.set(edge.id, edge);
    }

    // Merge groups
    for (const group of result.groups) {
      this.groups.set(group.id, group);
    }

    // Track source files
    for (const file of result.sourceFiles) {
      this.sourceFiles.add(file);
    }
  }

  addNode(node: Component): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: Connection): void {
    this.edges.set(edge.id, edge);
  }

  addGroup(group: LogicalGroup): void {
    this.groups.set(group.id, group);
  }

  build(): ArchitectureGraph {
    const metadata: ProjectMetadata = {
      projectName: this.projectName,
      techStack: Array.from(this.techStack),
      cloudProvider: this.cloudProvider,
      analyzedAt: new Date().toISOString(),
      sourceFiles: Array.from(this.sourceFiles)
    };

    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      groups: Array.from(this.groups.values()),
      metadata
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd plugins/arch-designer && npm test`
Expected: PASS

**Step 5: Commit**

Run: `git add plugins/arch-designer/src/graph/ && git commit -m "feat(arch-designer): add GraphBuilder for merging analyzer results"`

---

## Phase 3: Analyzers

### Task 3.1: Create Base Analyzer Interface

**Files:**
- Create: `plugins/arch-designer/src/analyzers/base.ts`
- Test: `plugins/arch-designer/src/analyzers/base.test.ts`

See design document for full implementation details. Pattern: abstract class with `canAnalyze()` and `analyze()` methods.

### Task 3.2: Create Terraform Analyzer

Extracts AWS resources: Lambda, DynamoDB, S3, SQS, API Gateway, etc.

### Task 3.3: Create Docker Compose Analyzer

Extracts services, dependencies, and infers component types from images.

### Task 3.4: Create Analyzer Registry

Central registry for all analyzers with `runAllAnalyzers()` function.

---

## Phase 4: Layout Engine

### Task 4.1: Create Dagre Layout Wrapper

Wraps dagre.js to convert ArchitectureGraph → positioned LayoutResult.

---

## Phase 5: SVG Renderer

### Task 5.1: Create Color Palette

ByteByteGo color scheme: frontend=blue, compute=green, data=orange, etc.

### Task 5.2: Create SVG Renderer Core

Renders positioned graph to animated SVG with:
- Rounded rect nodes with service badges
- Animated flow dots on edges
- Arrow markers
- Hover effects

---

## Phase 6: Skill and CLAUDE.md

### Task 6.1: Create Plugin Skill

Define when to use the plugin and available commands.

---

## Phase 7: Integration

### Task 7.1: Create Main Entry Point

Export all modules and provide `generateArchitecture()` convenience function.

### Task 7.2: Create README

Document installation, usage, and output structure.

---

## Dependencies

```json
{
  "dependencies": {
    "d3": "^7.8.5",
    "dagre": "^0.8.5",
    "yaml": "^2.3.0",
    "puppeteer": "^21.0.0",
    "@marp-team/marp-core": "^3.9.0"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/dagre": "^0.7.52",
    "vitest": "^1.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Future Phases

- **Phase 8**: Additional analyzers (Kubernetes, CDK, Serverless, App Code)
- **Phase 9**: PNG/PDF export with Puppeteer
- **Phase 10**: Pitch deck generation with Reveal.js/Marp
- **Phase 11**: Git hooks for auto-refresh
- **Phase 12**: Interactive refinement commands
