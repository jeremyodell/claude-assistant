# /arch:deck $TYPE

Generate a pitch deck with architecture diagrams.

## Arguments

- `$TYPE`: Deck type - `--investor` or `--client`

## Usage

/arch:deck --investor
/arch:deck --client

## Investor Deck Structure

| Slide | Content | Source |
|-------|---------|--------|
| Title | Company name, tagline | User input |
| Problem | Pain point you solve | User input |
| Solution | Overview diagram | Auto-generated |
| How It Works | Animated data flow | Auto-generated |
| Market Size | TAM/SAM/SOM | User input |
| Business Model | Revenue model | User input |
| Traction | Metrics, growth | User input |
| Architecture | Full system diagram | Auto-generated |
| Competition | Market positioning | User input |
| Team | Founder bios | User input |
| The Ask | Funding request | User input |

## Client Deck Structure

| Slide | Content | Source |
|-------|---------|--------|
| Title | Company name, tagline | User input |
| Their Problem | Client pain points | User input |
| Solution | Overview diagram | Auto-generated |
| How It Works | Simple flow | Auto-generated |
| Architecture | Trust/reliability view | Auto-generated |
| Case Study | Client results | User input |
| Security | Security diagram | Auto-generated |
| Integration | Integration points | Auto-generated |
| Pricing | Pricing tiers | User input |
| Next Steps | CTA | User input |

## Execution Steps

1. **Generate diagrams** - Run /arch:generate if not already done
2. **Prompt for content** - Ask user for each manual slide
3. **Build deck** - Combine diagrams with user content
4. **Export formats** - HTML (Reveal.js), PDF, PPTX

## Output

Decks saved to `docs/architecture/decks/`:
- `investor-deck.html` - Interactive web presentation
- `investor-deck.pdf` - Static export
- `investor-deck.pptx` - Editable PowerPoint
