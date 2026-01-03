# Skills

Custom skills for Claude Code.

## Structure

Each skill should be in its own directory with a `SKILL.md` file:

```
skills/
└── my-skill/
    ├── SKILL.md          # Required - skill definition
    ├── scripts/          # Optional - executable scripts
    ├── references/       # Optional - documentation to load as needed
    └── assets/           # Optional - templates, images, etc.
```

## Adding a Skill

1. Create a directory for your skill
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`) and markdown instructions
3. Add any supporting files

See [Anthropic's skill documentation](https://docs.anthropic.com) for details.
