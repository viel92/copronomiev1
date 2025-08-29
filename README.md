# copronomiev1

This repository is organized as a minimal monorepo using npm workspaces.

## Structure
- `packages/api` – serverless functions.
- `packages/web` – Vite React front‑end.

## Development
Install dependencies and run scripts from the repository root:

```bash
npm install
npm run dev    # start web app
npm run build  # build web app
```

The API is exposed under `/api/*` and implemented in `packages/api`.
