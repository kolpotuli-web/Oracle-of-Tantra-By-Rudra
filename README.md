# The Oracle of Tantra

A living research library for Tantra and related esoteric traditions.

## Current build

The project now has an atmospheric Bengali folk-art / patachitra-inspired entrance and a calm researcher shell designed around long-form reading. The entrance is built with original HTML/CSS/SVG-style primitives rather than a stock background video, so it can be animated and interactive without depending on a large media asset.

### Frontend experience

- Cinematic illustrated entrance with subtle motion, lamps, moon, shelves, manuscript and an Oracle figure.
- Skip/reduced-motion-friendly entrance path.
- Research workspace with a quiet animated library background.
- Kindle-inspired reading direction and planned Focus Mode.
- Clickable shelf books with source information panels.
- Oracle / Researcher mode switch foundation.
- Search, projects, sources, notes, bookmarks, traditions and texts navigation shell.

### Backend

- `backend/server.js` — Express API, security headers, CORS, validation, rate limiting and provider abstraction.
- Six-language API contract: English, Bengali, Hindi, Sanskrit, Mandarin Chinese and Spanish.
- OpenAI default model is `gpt-5.6-luna`; Pollinations remains an optional fallback.
- The browser never receives the OpenAI API key.

### Planned next layers

1. Google + email/password authentication.
2. Guest mode with restricted research features.
3. Persistent PostgreSQL data model for users, conversations, projects, notes, bookmarks and source records.
4. Private document uploads with explicit consent before any source submission.
5. Source submission/review queue with evidence and rights verification.
6. Curated knowledge base, RAG and source-chain citations.
7. Personal Oracle memory with explicit opt-in and deletion controls.
8. Admin console and moderation/review tools.

See `docs/architecture.md` for the product and evidence principles.

## Run locally

Requirements: Node.js 18+.

```bash
cd backend
npm install
cp .env.example .env
# Add OPENAI_API_KEY if using OpenAI.
npm start
```

Open `http://localhost:3000`.

The Oracle is a research assistant, not an authority or substitute for qualified teachers, translators or academic sources. Important historical claims should be checked against primary texts and reputable scholarship.
