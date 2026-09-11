# Oracle of Tantra — By Rudra

A research-oriented conversational interface for exploring Tantra and related esoteric traditions.

## Architecture

- `index.html` — responsive frontend, bilingual English/Bengali UI, local conversation persistence and voice input.
- `backend/server.js` — Express API, security headers, CORS, validation, rate limiting and AI provider abstraction.
- `backend/.env.example` — environment configuration template.
- `render.yaml` — deployment configuration for Render.

The browser **never receives the OpenAI API key**. It talks to `/api/chat`, and the server talks to the model provider.

## Run locally

Requirements: Node.js 18+.

```bash
cd backend
npm install
cp .env.example .env
# Put your OPENAI_API_KEY in .env for the preferred provider.
npm start
```

Then open `http://localhost:3000`.

If `OPENAI_API_KEY` is empty, the backend uses the configured Pollinations fallback provider.

## Production notes

Before a public launch, add a persistent database/auth layer if accounts or saved research sessions are needed, and consider a managed secret store, observability, stricter per-user quotas, and a curated source/RAG layer for historical claims.

The Oracle is an AI research assistant, not an authority or substitute for qualified teachers, translators or academic sources. Important historical claims should be verified against primary texts and reputable scholarship.
