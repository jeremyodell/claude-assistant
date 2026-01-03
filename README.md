# Claude Assistant

A collection of plugins, skills, and tools for Claude Code.

## Structure

```
claude-assistant/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest (points to all plugins)
├── plugins/                  # Claude Code plugins
│   └── team-workflow/        # Team development workflow plugin
├── skills/                   # Custom skills
├── tools/                    # MCP tools and utilities
└── README.md
```

## Installation

### Add the Marketplace

```
/plugin marketplace add git@github.com:jeremyodell/claude-assistant.git
```

### Install Plugins

Once the marketplace is added, install individual plugins:

```
/plugin install team-workflow@jeremyodell
```

## Plugins

### team-workflow

Deterministic team development workflow with Linear integration, enforced TDD, and quality gates.

**Commands:**
- `/team:task ENG-123` — Start work on a Linear issue
- `/team:quality-check` — Run all quality gates
- `/team:ship` — Create PR and update Linear

[Full documentation](./plugins/team-workflow/README.md)

## Skills

*Coming soon*

## Tools

*Coming soon*

## License

MIT
