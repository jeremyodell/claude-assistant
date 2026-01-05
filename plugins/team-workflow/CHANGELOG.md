# Changelog

All notable changes to the team-workflow plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-05

### Added
- Pre-planned ticket detection via "pre-planned" label
- Automatic phase skipping for tickets with existing implementation plans
- Phase skip announcement in workflow output
- CHANGELOG.md for version tracking

### Changed
- Phase 0 now checks ticket labels to determine if Phases 1-2 should be skipped
- Workflow jumps directly to Phase 3 (Execute) for pre-planned tickets
- Updated task.md workflow documentation

## [1.0.0] - Initial Release

### Added
- Deterministic 5-phase workflow (Setup → Brainstorm → Plan → Execute → Quality → Ship)
- Linear integration with automatic status updates
- TDD enforcement through all phases
- Quality gates (tests, lint, typecheck, code review)
- Parallel feature orchestration via /team:feature
- Execution mode detection (direct vs subagent)
- PreToolUse, PostToolUse, and Stop hooks for quality enforcement
- Superpowers integration for brainstorming and planning
- Conventional commit format with Linear IDs
- Automated PR creation with /team:ship
