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
