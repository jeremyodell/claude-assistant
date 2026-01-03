# Tools

MCP servers and utilities for Claude Code.

## Structure

Each tool should be in its own directory:

```
tools/
└── my-mcp-server/
    ├── package.json      # Dependencies
    ├── src/
    │   └── index.ts      # MCP server implementation
    └── README.md         # Usage documentation
```

## Adding a Tool

1. Create a directory for your tool
2. Implement the MCP server (TypeScript recommended)
3. Add configuration to `.mcp.json` in relevant plugins

See [MCP documentation](https://modelcontextprotocol.io) for details.
