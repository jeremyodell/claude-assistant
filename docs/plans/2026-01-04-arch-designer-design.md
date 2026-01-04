# Arch Designer Plugin - Design Document

**Date:** 2026-01-04
**Status:** Approved
**Plugin Name:** `arch-designer`

## Overview

A code-first architecture diagramming and pitch deck generation plugin that scans codebases to discover infrastructure and generates ByteByteGo-quality visualizations with multiple export formats.

## Core Features

1. **Code-Driven Discovery** - Analyzes actual codebase rather than manual descriptions
2. **ByteByteGo Visual Style** - Professional iconography, animations, annotations
3. **Multiple Diagram Types** - System architecture, AWS/cloud, data flow, sequence
4. **Pitch Deck Generation** - Investor and client templates with guided fill-in
5. **Multi-Format Export** - SVG, PNG, PDF, PPTX, HTML, social-sized images
6. **Auto-Refresh** - Git hooks regenerate diagrams when infrastructure changes

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Code Analysis  │────▶│  Graph Builder   │────▶│   Renderer      │
│                 │     │                  │     │                 │
│ • IaC files     │     │ • Nodes (services)│    │ • Animated SVG  │
│ • App code      │     │ • Edges (flows)  │     │ • Static PNG    │
│ • Config files  │     │ • Groupings      │     │ • HTML embed    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Plugin Structure

```
plugins/arch-designer/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── generate.md      # /arch:generate - full diagram suite
│   ├── view.md          # /arch:view <scope> - custom queries
│   ├── deck.md          # /arch:deck --investor/--client
│   ├── export.md        # /arch:export - multi-format output
│   └── refresh.md       # /arch:refresh - regenerate from code
├── skills/
│   └── arch-designer/
│       └── SKILL.md
├── hooks/
│   └── hooks.json       # Git hook for auto-regeneration
├── lib/
│   ├── analyzers/       # Code analysis modules
│   │   ├── terraform.ts
│   │   ├── cdk.ts
│   │   ├── kubernetes.ts
│   │   ├── docker.ts
│   │   ├── serverless.ts
│   │   └── app-code.ts
│   ├── graph/           # Graph model
│   │   └── types.ts
│   ├── layout/          # Auto-layout
│   │   └── dagre-layout.ts
│   ├── renderers/       # Output generators
│   │   ├── svg-renderer.ts
│   │   ├── png-exporter.ts
│   │   ├── pdf-exporter.ts
│   │   └── deck-builder.ts
│   └── templates/       # SVG templates
│       ├── aws-icons/
│       ├── tech-icons/
│       └── components/
└── assets/
    └── icons/           # AWS, tech iconography
```

## Code Analysis Engine

### Sources Scanned

| Source Type | Files | Extracted Information |
|-------------|-------|----------------------|
| Terraform | `*.tf` | AWS resources, VPCs, security groups, IAM roles |
| CDK/CloudFormation | `*.ts`, `*.yaml` | Stacks, constructs, resource relationships |
| Kubernetes | `*.yaml` | Services, deployments, ingress, config maps |
| Docker | `docker-compose.yml`, `Dockerfile` | Services, networks, volumes, dependencies |
| Serverless | `serverless.yml` | Functions, triggers, API routes |
| Application Code | `*.ts`, `*.py`, `*.go` | API endpoints, DB connections, service calls |
| Package Config | `package.json`, `requirements.txt` | External service SDKs |

### Discovery Patterns

- **Service boundaries** - Separate deployables, Lambda functions, containers
- **Data stores** - Database connections, cache clients, S3 buckets
- **Communication** - HTTP calls, queue producers/consumers, event emitters
- **External integrations** - Third-party APIs, payment providers, auth services
- **Infrastructure groupings** - VPCs, subnets, availability zones

### Output Model

```typescript
interface ArchitectureGraph {
  nodes: Component[];      // Services, databases, queues, etc.
  edges: Connection[];     // Data flows, API calls, events
  groups: LogicalGroup[];  // VPCs, regions, service boundaries
  metadata: ProjectInfo;   // Tech stack, cloud provider, etc.
}

interface Component {
  id: string;
  name: string;
  type: ComponentType;     // 'service' | 'database' | 'queue' | 'storage' | etc.
  provider?: string;       // 'aws' | 'gcp' | 'azure' | 'generic'
  service?: string;        // 'lambda' | 'dynamodb' | 'sqs' | etc.
  metadata: Record<string, any>;
}

interface Connection {
  from: string;
  to: string;
  type: ConnectionType;    // 'http' | 'grpc' | 'event' | 'query' | etc.
  protocol?: string;
  label?: string;
}

interface LogicalGroup {
  id: string;
  name: string;
  type: GroupType;         // 'vpc' | 'region' | 'service-boundary' | etc.
  children: string[];      // Component or group IDs
}
```

## Visual Style System

### Color Palette (Semantic Groupings)

| Category | Color | Used For |
|----------|-------|----------|
| Frontend | `#4A90D9` Blue | React, Vue, mobile apps, CDN |
| API Layer | `#7B68EE` Purple | API Gateway, Load Balancers, GraphQL |
| Compute | `#50C878` Green | Lambda, ECS, EC2, Kubernetes pods |
| Data | `#FF8C42` Orange | DynamoDB, RDS, S3, Elasticsearch |
| Messaging | `#FFD700` Gold | SQS, SNS, EventBridge, Kafka |
| Security | `#DC143C` Red | IAM, Cognito, WAF, secrets |
| External | `#808080` Gray | Third-party APIs, SaaS integrations |

### Icon System

- **AWS icons** - Official AWS Architecture Icons (SVG)
- **Generic tech** - Consistent style icons for non-AWS (Docker, Kubernetes, databases)
- **Custom services** - Auto-generated icons with service initials + category color

### Animation Types

1. **Flow Animation** - Request/response packets moving along connections
2. **Pulse Animation** - Active connections gently pulse, idle connections static
3. **Step Animation** - Numbered sequence highlights each step in order

### Annotations

- **Numbered steps** ①②③ for request flows
- **Callout boxes** for explaining key decisions
- **Protocol labels** (HTTPS, gRPC, WebSocket) on connections
- **Latency hints** (optional) showing typical response times

## Pitch Deck Generation

### Investor Deck (`/arch:deck --investor`)

| Slide | Purpose | Auto/Manual |
|-------|---------|-------------|
| 1. Title | Hook | Manual |
| 2. Problem | Pain point | Manual |
| 3. Solution | Your answer | Auto (diagram) + Manual |
| 4. How It Works | Product demo | Auto (animated flow) |
| 5. Market Size | Opportunity | Manual |
| 6. Business Model | Revenue | Manual |
| 7. Traction | Proof | Manual |
| 8. Tech Architecture | Moat | Auto (full diagram) |
| 9. Competition | Positioning | Manual |
| 10. Team | Credibility | Manual |
| 11. The Ask | CTA | Manual |

### Client Deck (`/arch:deck --client`)

| Slide | Purpose | Auto/Manual |
|-------|---------|-------------|
| 1. Title | Hook | Manual |
| 2. Their Problem | Empathy | Manual |
| 3. Your Solution | Answer | Auto (diagram) + Manual |
| 4. How It Works | Clarity | Auto (simple flow) |
| 5. Architecture | Trust | Auto (reliability view) |
| 6. Case Study | Proof | Manual |
| 7. Security & Compliance | Trust | Auto (security diagram) |
| 8. Integration | Easy | Auto (integration points) |
| 9. Pricing | Transparency | Manual |
| 10. Next Steps | CTA | Manual |

### Deck Output Formats

- **Reveal.js HTML** - Interactive, animations work
- **PDF** - Static, universally viewable
- **PPTX** - Editable PowerPoint
- **Google Slides** - Direct export if API configured

## Export System

### Diagram Exports

| Format | Use Case | Features |
|--------|----------|----------|
| Animated SVG | Docs, websites | Embedded animations, hover states |
| Static SVG | High-quality print | Vector, infinitely scalable |
| PNG | Social media | Pre-sized for LinkedIn, Twitter |
| PNG @2x | Retina/presentations | Double resolution |
| HTML embed | README, blogs | Self-contained snippet |
| Markdown | GitHub README | Image with interactive link |

### Social Media Presets

- `linkedin-post.png` (1200×627)
- `twitter-post.png` (1600×900)
- `instagram-square.png` (1080×1080)
- `suggested-caption.md` - AI-generated post text

### Output Structure

```
docs/architecture/
├── latest/                      # Symlink to newest
│   ├── overview.svg
│   ├── overview.png
│   ├── overview-linkedin.png
│   ├── data-flow.svg
│   ├── infrastructure.svg
│   └── embed.html
├── decks/
│   ├── investor-deck.html
│   ├── investor-deck.pdf
│   ├── investor-deck.pptx
│   ├── client-deck.html
│   └── client-deck.pdf
└── 2026-01-04/                  # Versioned snapshots
    └── ...
```

## Commands

| Command | Purpose |
|---------|---------|
| `/arch:generate` | Full scan & diagram suite |
| `/arch:view <scope>` | Custom scoped diagram |
| `/arch:deck --investor` | Investor pitch deck with guided prompts |
| `/arch:deck --client` | Client/sales deck with guided prompts |
| `/arch:export` | Export all formats |
| `/arch:export --social` | Social-sized images only |
| `/arch:refresh` | Regenerate from current code |

## Interactive Refinement

After generation, supports conversational refinement:
- "Zoom into the payment flow"
- "Add a callout explaining why we use SQS here"
- "Move the database to the right side"
- "Show the failure path"
- "Export just this view"

## Git Hook Integration

```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "match": {
        "tool": "Write",
        "path": ["**/terraform/**", "**/cdk/**", "**/serverless.yml"]
      },
      "command": "Regenerate architecture diagrams"
    }
  ]
}
```

## Technical Implementation

### Rendering Pipeline

```
Analyzers → Graph Model → Layouter (dagre.js) → Renderer (D3.js + SVG)
                                                       │
                                    ┌──────────────────┼──────────────┐
                                    ▼                  ▼              ▼
                              Animated SVG           PNG            PDF
```

### Pitch Deck Pipeline

```
Diagrams + User Input → Markdown Slide Defs → Reveal.js/Marp → HTML/PDF/PPTX
```

### Dependencies

- `d3` - Graph rendering and animations
- `dagre` - Automatic graph layout
- `puppeteer` - Headless Chrome for PNG/PDF export
- `reveal.js` - Interactive presentations
- `marp` - Markdown to PPTX conversion

## Default Views Generated

1. **Overview** - High-level system architecture
2. **Per-Service** - Detailed view of each major service
3. **Data Flow** - How data moves through the system
4. **Infrastructure** - AWS/cloud resources and networking
5. **Security** - Auth, encryption, IAM boundaries

## Success Criteria

- [ ] Accurately discovers architecture from supported IaC and code
- [ ] Generates visually appealing diagrams matching ByteByteGo style
- [ ] Animations work smoothly in SVG exports
- [ ] PNG exports are properly sized for social platforms
- [ ] Pitch deck generation guides user through missing content
- [ ] Git hooks successfully trigger regeneration
- [ ] Interactive refinement works conversationally
