# Plugin Structure Analyzer Design

**Date:** 2026-01-04
**Status:** Approved
**Plugin:** arch-designer

## Overview

Add a new analyzer to arch-designer that scans Claude Code plugin directories and generates architecture diagrams showing plugin structure, components, and relationships.

## Requirements

1. **Hierarchical view** - Marketplace → Plugins → Components
2. **Show top-level modules** - Include `src/` subdirectories as nodes
3. **Detect relationships** - Analyze content for cross-references between components

## Component Types

| Type | Color | Description |
|------|-------|-------------|
| `marketplace` | Purple | Root container from marketplace.json |
| `plugin` | Blue | Plugin directory with plugin.json |
| `command` | Green | Slash commands (commands/*.md) |
| `skill` | Teal | Skills (skills/*/SKILL.md) |
| `hook` | Orange | Hooks (hooks/*.md) |
| `mcp` | Gold | MCP servers (.mcp.json entries) |
| `module` | Gray | Source modules (src/*/) |

## Connection Types

| Type | Description |
|------|-------------|
| `triggers` | Skill/hook invokes a command |
| `validates` | Hook validates/blocks a command |
| `depends-on` | Plugin requires another plugin |
| `exports` | Plugin exposes a module |

## Analyzer Flow

```
1. Find marketplace root (.claude-plugin/marketplace.json)
   └── Create marketplace node

2. For each plugin in marketplace.plugins:
   ├── Read .claude-plugin/plugin.json → plugin node
   ├── Glob commands/*.md → command nodes
   ├── Glob skills/*/SKILL.md → skill nodes
   ├── Glob hooks/*.md → hook nodes
   ├── Read .mcp.json → mcp nodes
   └── Glob src/*/ → module nodes

3. Parse content for relationships:
   ├── Regex /\w+:\w+/ in skills/hooks → triggers edges
   ├── Regex "requires \w+ plugin" → depends-on edges
   └── Read src/index.ts exports → exports edges

4. Build logical groups:
   └── Each plugin is a group containing its components
```

## File Structure

```
plugins/arch-designer/src/
├── graph/types.ts           # Add new ComponentType, ConnectionType values
├── analyzers/
│   ├── plugin-structure.ts      # New analyzer
│   ├── plugin-structure.test.ts # Tests
│   └── registry.ts              # Register new analyzer
└── renderers/colors.ts      # Add colors for new types
```

## Test Cases

1. Empty directory → empty result
2. Single plugin with no components → plugin node only
3. Plugin with commands → plugin + command nodes + contains edges
4. Plugin with skills referencing commands → triggers edges
5. Plugin with src modules → module nodes
6. Full marketplace → complete hierarchy

## Implementation Notes

- Use `canAnalyze()` to check for `.claude-plugin/marketplace.json` or `.claude-plugin/plugin.json`
- Extract command names from markdown headers (`# /prefix:name`)
- Extract skill names from directory names in `skills/`
- Parse hook frontmatter for event types
