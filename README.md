# Systemic Risk Projection Model (SRPM)

Monte Carlo state-transition simulation for the Civilization Options Fund.

## Quick Start

Open `index.html` in a browser. No server required.

## Files

```
srpm/
  CLAUDE.md       -- Claude Code instructions (read automatically)
  README.md       -- This file
  index.html      -- Full application (layout + CSS)
  engine.js       -- Simulation engine (Monte Carlo core)
  ui.js           -- UI controller (sliders, charts, interaction)
  docs/
    SRPM_Technical_Documentation_v4_1.docx  -- Math specification
    SRPM_How_It_Works_v4_1.docx             -- Plain-English guide
```

## Development

Edit files directly. Open index.html in browser to test. Push to GitHub for live updates.

## Claude Code Usage

From this directory: `claude`

Example tasks:
- "Update the insurance market failure default to 75% and add a source note about the 2026 California wildfire season"
- "Add a new disruption vector for water scarcity"
- "The compounding function needs review -- Rob suggests a sigmoid rather than power law"
- "Regenerate the technical documentation to reflect the changes we just made"
