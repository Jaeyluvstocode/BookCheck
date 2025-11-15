Deployment & CI Notes
=====================

Quick steps to run locally with Docker Compose:

1. Copy `.env.example` to `.env` and update secrets:

   cp .env.example .env
   echo "your_strong_jwt_secret" > ./.jwt_secret

2. Build and run services:

   docker-compose up --build -d

3. Visit client at `http://localhost:3000` and server at `http://localhost:3001/api`.

GitHub Actions:
- CI workflow is in `.github/workflows/ci.yml`. It starts a MongoDB service, installs deps, starts the server, runs smoke tests, builds the client, and builds a server image.

Notes & Security:
- Replace `.jwt_secret` before deploying to production and use a secure secret manager.
- Do not commit production secrets to the repo.
Secrets & CI
 - Set repository secret `JWT_SECRET` (Settings → Secrets → Actions) to a strong value.
 - The CI will use `secrets.JWT_SECRET` when starting the server for tests.
 - To publish Docker images to GitHub Container Registry (GHCR) from CI, ensure `GITHUB_TOKEN` has package write permission (default for GitHub Actions) and the action will push images to `ghcr.io/<your-org-or-user>/bookcheck-*`.

Removing placeholder secret file
 - The repository includes a placeholder `.jwt_secret` for local docker-compose convenience. Replace its contents with a secure secret or remove the file and rely on environment variables / secret managers in production. Do NOT commit production secrets.

Quick checklist before production deploy
1. Set `JWT_SECRET` as a GitHub secret.
2. Replace `.jwt_secret` locally with a secure secret (or remove and use env).
3. Update `MONGO_URI` in `.env` to point to your production database (Atlas or managed DB).
4. If publishing images, confirm GHCR permissions or provide Docker Hub credentials.
5. Run `docker-compose up --build -d` (or your preferred orchestration).
