# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Claude Code plugin marketplace repository containing plugins, skills, and tools. The marketplace is registered via `.claude-plugin/marketplace.json`.

## Commands

### Plugin Development (arch-designer example)

```bash
cd plugins/arch-designer
npm install          # Install dependencies
npm test -- --run    # Run tests once
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Type check
npm run build        # Build TypeScript
```

### Marketplace Management

```bash
# Add this marketplace to Claude Code
/plugin marketplace add git@github.com:jeremyodell/claude-assistant.git

# Install a specific plugin
/plugin install team-workflow@jeremyodell
```

## Architecture

### Plugin Structure

Each plugin follows this structure:
```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json       # Plugin manifest (name, version, description)
├── commands/             # Slash commands (*.md files)
├── skills/               # Skills that teach Claude when/how to use the plugin
│   └── <skill-name>/
│       └── SKILL.md
├── hooks/                # Event hooks (PreToolUse, PostToolUse, etc.)
├── src/                  # TypeScript source (if plugin has code)
├── .mcp.json            # MCP server configuration (optional)
├── CLAUDE.md            # Plugin-specific rules
└── README.md            # Documentation
```

### Marketplace Registry

`.claude-plugin/marketplace.json` lists all plugins to publish. Add new plugins here:

```json
{
  "plugins": [
    {
      "name": "plugin-name",
      "version": "1.0.0",
      "description": "...",
      "source": "./plugins/plugin-name"
    }
  ]
}
```

### Current Plugins

| Plugin | Purpose |
|--------|---------|
| team-workflow | Linear integration, TDD enforcement, quality gates |
| ideate | Guided ideation with pressure testing |
| arch-designer | Architecture diagram generation from IaC |

## Development Patterns

### Plugin TypeScript (arch-designer pattern)

```
src/
├── graph/          # Core types and graph building
├── analyzers/      # Infrastructure analyzers (Terraform, Docker, etc.)
├── layout/         # Dagre-based positioning
├── renderers/      # SVG output generation
└── index.ts        # Public API exports
```

### Testing

Plugins with TypeScript use Vitest. Each module has a co-located `.test.ts` file.

```bash
npm test -- --run src/specific.test.ts   # Run single test file
npm test -- --run --reporter=verbose     # Verbose output
```
