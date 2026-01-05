# Changelog

All notable changes to the ideate plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-05

### Added
- Automatic "pre-planned" label creation in Linear if it doesn't exist
- "pre-planned" label automatically added to all parent and sub-issues during upload
- Integration with team-workflow plugin for seamless phase skipping
- Purple label color (#7C3AED) for "pre-planned" label
- Enhanced completion announcement showing "pre-planned" label status

### Changed
- `/ideate:upload` now ensures "pre-planned" label exists before creating issues
- All sub-issues now receive "pre-planned" label to indicate detailed implementation plans
- Step numbering updated in upload.md to accommodate new label creation step

## [1.0.0] - Initial Release

### Added
- Five-phase workflow: Brainstorm → Pressure Test → Plan → Stories → Upload
- `/ideate:brainstorm` - Collaborative idea fleshing out with Superpowers integration
- `/ideate:pressure-test` - Mandatory validation with scope drift checking and YAGNI enforcement
- `/ideate:plan` - Detailed implementation planning
- `/ideate:stories` - Story decomposition with dependency inference
- `/ideate:upload` - Linear issue creation with parent-child structure
- `/ideate:setup` - Interactive Linear team/project configuration
- Automatic dependency detection (data → API → UI)
- Label auto-suggestion based on content patterns
- Native Linear blocking relations support
- Resumability at each phase via saved artifacts
- UI feature detection with frontend-designer integration requirement
