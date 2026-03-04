# Systemic Risk Projection Model (SRPM)

## Project Overview

The SRPM is a Monte Carlo state-transition simulation that projects systemic risk over a 10-year horizon (2026-2036). It runs 5,000 simulations across 5 world-states, driven by 12 disruption vectors with event correlation, EROI background pressure, recovery degradation, and nonlinear compounding. It is built for the Civilization Options Fund (COF) as a tool for capital partners to understand why formation capital is a rational portfolio allocation.

The model is a structured scenario framework, not a predictive product. All parameters are transparent and adjustable. It is designed to be interrogated, not accepted on authority.

## Architecture

The app is a single-page web application hosted on GitHub Pages. No server, no dependencies beyond Chart.js. Three files:

- `index.html` -- Full layout, CSS, section structure. Dark theme, scroll-based navigation, responsive grid layout. Uses Instrument Serif, DM Sans, and JetBrains Mono fonts.
- `engine.js` -- The simulation engine (~400 lines). Monte Carlo core, transition matrix, event firing, correlation, compounding, EROI pressure, recovery degradation, substrate health index, portfolio model. Exposes the `ENGINE` global object.
- `ui.js` -- UI controller (~500 lines). Builds sliders, presets, charts (Chart.js), stacked bars, stat cards, event timeline, and the scroll spy navigation. Handles all user interaction.

## Core Model Mechanics

### World-States (5)
0. Stable Adaptation -- institutions functioning, growth plausible
1. Managed Disruption -- measurable stress, institutions holding (default starting state)
2. Severe Disruption -- multiple stresses exceeding institutional capacity
3. Systemic Crisis -- institutional failure in progress, correlated repricing
4. Civilizational Stress -- near-complete institutional breakdown

### Disruption Vectors (12)
10 threat vectors + 2 bidirectional (Energy Transition, Institutional Formation):

| Vector | Default % | Peak Window | Magnitude | Duration | Type |
|--------|-----------|-------------|-----------|----------|------|
| AI Labour Displacement | 55% | Y1-Y4 | 0.30 | 8yr | Structural |
| Insurance Market Failure | 70% | Y1-Y5 | 0.25 | 10yr | Structural |
| Climate Tipping Signal | 30% | Y5-Y9 | 0.35 | 10yr | Structural |
| Conventional Conflict | 25% | Y0-Y9 | 0.22 | 3yr | Acute |
| Nuclear Exchange | 8% | Y0-Y9 | 0.55 | 10yr | Acute |
| Pandemic / Biosecurity | 20% | Y0-Y9 | 0.20 | 2yr | Acute |
| Sovereign Debt Crisis | 35% | Y1-Y6 | 0.28 | 4yr | Structural |
| Food System Shock | 25% | Y3-Y9 | 0.30 | 8yr | Structural |
| Cyber / Infrastructure | 35% | Y0-Y6 | 0.26 | 2yr | Acute |
| Democratic Collapse | 40% | Y0-Y5 | 0.32 | 10yr | Structural |
| Energy Transition | -20% | Y2-Y8 | 0.30 | 7yr | Bidirectional |
| Institutional Formation | -15% | Y3-Y9 | 0.25 | 8yr | Bidirectional |

Percentages are cumulative probability over the peak window, not annual. Negative = stabilizing.

### Key Mechanisms
- **Base transition matrix**: 5x5 Markov chain with asymmetric recovery (easier to break than fix)
- **Event firing**: Each vector fires at most once per simulation during its peak window
- **Correlation**: 12 pairwise multipliers amplify co-occurring events (e.g., Climate + Food = 1.5x)
- **Compounding**: Power-law function with user-adjustable intensity (0.10-0.50). Multiple simultaneous events compound nonlinearly.
- **EROI background pressure**: Linear annual increase in downward transition pressure (default 0.3%/yr, adjustable 0-1%)
- **Recovery degradation**: Cumulative degradation of upward transition probabilities (0.08/yr, caps at 0.6). Path dependence.
- **Substrate health index**: 0-100 score tracking institutional capacity, starting at 55

### Portfolio Model
Three archetypes tracked at $100M starting value:
- **Conventional Portfolio**: +7% stable, +2% managed, -10% severe, -28% crisis, -50% civ stress
- **Resilient Real Assets**: +5%, +6%, +2%, -8%, -20%
- **Formation Capital**: +4%, +8%, +10%, +3%, -8%

The structural insight: Formation Capital is negatively correlated with institutional failure. The divergence at the 10th percentile is where the allocation argument lives.

### Presets
The model ships with scenario presets (defined in engine.js under ENGINE.PRESETS) that configure all sliders to represent different worldviews: current trends, optimistic, pessimistic, and others.

## File Conventions

- Vanilla HTML/CSS/JS only. No build tools, no frameworks, no npm.
- Chart.js loaded via CDN (`https://cdn.jsdelivr.net/npm/chart.js`)
- All CSS is inline in index.html within a `<style>` block
- Dark theme with CSS custom properties (--bg, --teal, --red, --amber, --green, etc.)
- The ENGINE object in engine.js exposes: `ENGINE.run(config)`, `ENGINE.EVENTS`, `ENGINE.PRESETS`, `ENGINE.STATES`, `ENGINE.SOURCES`, `ENGINE.CORRELATIONS`

## Development Workflow

When making changes:
1. Edit the relevant file (engine.js for model logic, ui.js for interface, index.html for layout/style)
2. Test locally by opening index.html in a browser
3. The model should run correctly with no server -- just open the file
4. Push to GitHub to update the live GitHub Pages site

## Common Tasks

### Updating a vector's default probability or calibration
Edit the EVENTS array in engine.js. Each event object has: id, name, base (default %), peak [start, end], mag (magnitude), dur (duration), recovery (boolean), desc (description). Also update the matching entry in SOURCES.

### Adding a new disruption vector
Add to the EVENTS array in engine.js. Add source data to SOURCES. Add any pairwise correlations to the CORRELATIONS array. Add the event description and interpretation function to EVENT_INFO in ui.js. The UI auto-builds sliders from the EVENTS array.

### Adjusting the transition matrix
The base matrix is in engine.js in the run() function. Rows = current state, columns = next state. Rows must sum to 1.0.

### Adding or modifying a preset
Edit ENGINE.PRESETS in engine.js. Each preset has a label, description, and a values object mapping event IDs to slider positions, plus global controls (startState, erpiRate, compoundScale).

### Updating portfolio return assumptions
Edit the RETURNS object in the run() function in engine.js. Three strategies x five states.

### Modifying chart appearance
All Chart.js configuration is in ui.js in the drawCharts() function and related helpers. Chart colors reference CSS custom properties.

## Documentation

Two companion documents are included in the /docs folder:
- `SRPM_Technical_Documentation_v4_1.docx` -- Full mathematical specification for technical reviewers. Every equation, functional form, and parameter choice.
- `SRPM_How_It_Works_v4_1.docx` -- Plain-English walkthrough for non-technical audiences (capital partners, board members).

## Collaborators

- **Jeff Reece** -- Project lead, editorial, strategic framing
- **Rob** -- Physicist, model architecture and mathematical review
- **Greg** -- React-based alternative version (separate repo)

## Context

This model exists within the Civilization Options Fund's capital formation strategy. It is a persuasion tool: it helps capital partners understand why conventional portfolios are structurally exposed to risks their existing models do not capture, and why formation capital is the rational hedge. The institutional failure amplifier (the gap between Scenario B physical-only losses and Scenario C full-cascade losses in the companion actuarial model) is the core insight.

The model is designed to be handed to a risk professional and pulled apart. The numbers are defensible, the assumptions are testable, and the transparency is the point.

## Editorial Filters

All documentation and descriptive text should follow:
- No em dashes
- No AI-performance phrases
- American English spelling (note: the codebase uses British spelling "Civilisational" in the state name and "stabilising" in some descriptions -- this is intentional for the existing version, do not change existing code spelling without explicit instruction)
