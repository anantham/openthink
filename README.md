# Openthink — Climate Coalition Map

A force-directed network map of Massachusetts climate coalitions and their member organizations. Coalitions are sized by member count; edges denote membership. Members in multiple coalitions naturally land between hubs.

This is an early prototype using placeholder data.

## Views

- **Map** — force-directed graph, drag/zoom/pan, click any node for a side drawer with that coalition's Projects, Events, and Actions.
- **Geographic** — Leaflet/CARTO dark map with coalitions + members plotted by location.
- **Events** — searchable list of upcoming + past events across all coalitions.
- **Projects** — list filterable by status (active/planning) and required skills.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploys cleanly to Vercel (Vite auto-detected — no config needed).

## Data

Placeholder data lives in `public/data.json`, generated from `scripts/generate-data.mjs`. Regenerate with:

```bash
node scripts/generate-data.mjs
```

The schema:

- `coalitions[]` — id, name, abbrev, color, lat/lng, member_ids, projects, events, actions, focus_tags
- `organizations[]` — id, name, type, geographic_focus, lat/lng, coalition_ids
- `edges[]` — `{ source: coalition_id, target: org_id }`

## Stack

- Vite + TypeScript
- D3 (force layout)
- Leaflet + CARTO dark tiles (geographic view)
- No backend yet — static SPA
