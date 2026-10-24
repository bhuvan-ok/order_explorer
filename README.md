# Orders Explorer

An internal tool for an operations team: one screen with a data grid of ~50,000 orders and a filter builder that controls what the grid shows.

> Work in progress. This README will be completed as the app is built.

## How to run

Requires **Node 24** (see `.nvmrc`) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # type-check + production build
```

## Design

Low-fidelity sketches drawn before writing any UI code, in [`design/`](design/):

- [`01-main.png`](design/01-main.png): the main screen with data, a filter and a selection
- [`02-empty.png`](design/02-empty.png): the filter matches zero orders
- [`03-details-and-bad-link.png`](design/03-details-and-bad-link.png): the details panel, and what happens when a broken link is opened
