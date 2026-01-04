# Arch Designer Plugin - Implementation Session Prompt

Copy and paste the prompt below into a new Claude Code session:

---

## Prompt

```
I need to implement the arch-designer plugin. This is a code-first architecture diagramming plugin that:

1. Scans codebases (Terraform, CDK, Kubernetes, Docker, Serverless) to discover infrastructure
2. Generates ByteByteGo-quality diagrams with animations and professional styling
3. Creates investor and client pitch decks
4. Exports to SVG, PNG, PDF, PPTX, and social media sizes

**Read these files first:**
- Design doc: `docs/plans/2026-01-04-arch-designer-design.md`
- Implementation plan: `docs/plans/2026-01-04-arch-designer-implementation.md`

**Use the `superpowers:executing-plans` skill to implement task-by-task.**

Start with Phase 1 (Plugin Scaffold) and work through the plan sequentially. Use TDD - write failing tests first, then implement. Commit after each task.

The plugin should be created at: `plugins/arch-designer/`

Begin implementation.
```

---

## What This Session Will Build

| Phase | What Gets Built |
|-------|-----------------|
| 1 | Plugin scaffold, package.json, tsconfig, command stubs |
| 2 | Graph types (Component, Connection, ArchitectureGraph) and GraphBuilder |
| 3 | Analyzers for Terraform and Docker Compose |
| 4 | Dagre.js layout wrapper |
| 5 | SVG renderer with ByteByteGo colors and animations |
| 6 | SKILL.md and CLAUDE.md |
| 7 | Main entry point and README |

## Prerequisites

Make sure you're in the project root:
```
cd /home/jeremyodell/dev/projects/claude-assistant
```

## Expected Output

After completion, you'll have:
```
plugins/arch-designer/
├── .claude-plugin/plugin.json
├── package.json
├── tsconfig.json
├── commands/
│   ├── generate.md
│   ├── view.md
│   ├── deck.md
│   ├── export.md
│   └── refresh.md
├── skills/arch-designer/SKILL.md
├── hooks/
├── src/
│   ├── index.ts
│   ├── graph/
│   │   ├── types.ts
│   │   └── builder.ts
│   ├── analyzers/
│   │   ├── base.ts
│   │   ├── terraform.ts
│   │   ├── docker.ts
│   │   └── index.ts
│   ├── layout/
│   │   └── dagre-layout.ts
│   └── renderers/
│       ├── colors.ts
│       └── svg-renderer.ts
├── CLAUDE.md
└── README.md
```
