# The Oracle of Tantra

A scholarly research library and researcher workspace for Tantra and related esoteric traditions.

## Current architecture

The production site is a static GitHub Pages frontend connected directly to Supabase for authentication, persistence, source governance, library catalogue data, corpus search, citations, and the Oracle interface.

### Frontend

- Patachitra / Indian-miniature-inspired visual shell with HTML interface layers.
- Library of primary texts and a separate catalogue for articles, reports, papers, books, and PDFs.
- Individual text research records with evidence notes, research notes, related texts, and linked public sources.
- Research workspace, projects, notes, bookmarks, and saved conversations.
- Journal and source-submission workflow.
- Curator / Admin console with Library CRUD and source-review governance.
- Six-language interface: English, Bengali, Hindi, Sanskrit, Mandarin Chinese, and Spanish.
- Accessibility hardening, keyboard navigation, Escape handling, backdrop-close behavior, and consistent Back controls.

### Data and research

Supabase stores the structured research data. Public Library records are filtered by visibility and curator approval. Public-domain or licensed files may be published as downloadable Library material; restricted or unknown works remain subject to review and lawful-link rules.

The searchable corpus uses approved source material and page-aware source chunks. Research citations can be attached to Oracle responses and opened through source cards.

### Local backend

`backend/` contains an optional Express server for local development and smoke testing. The GitHub Pages production site does not require a separate Render deployment.

The backend includes request validation, security headers, CORS controls, rate limiting, and an optional language-provider abstraction.

## Repository layout

```text
.
├── .github/workflows/   # CI, formatting, and GitHub Pages deployment
├── assets/              # Browser modules and generated visual assets
├── backend/             # Optional local Express server and smoke tests
├── docs/                # Product and architecture documentation
├── supabase/migrations/ # Database migration history tracked in Git
└── index.html           # Main static frontend entry point
```

## Code style

The repository uses two-space indentation, UTF-8 text, LF line endings, and Prettier 3.9.0 formatting conventions. Formatting is applied automatically by GitHub Actions.

## Local development

For the static frontend, open `index.html` through a local static server so module imports and browser storage behave normally.

For the optional backend:

```bash
cd backend
npm install
npm run check
npm run smoke
npm start
```

The Oracle is a research assistant, not an authority or substitute for qualified teachers, translators, initiatory lineages, or academic sources. Important historical claims should be checked against specified primary texts and reputable scholarship.
