# Setting up Berkeleytime

> Full details live in the docs: [Local Development](apps/docs/src/getting-started/local-development.md)
> (also at https://docs.berkeleytime.com/getting-started/local-development.html when published).

This repo is a **Turbo monorepo**. Local development runs via **Docker Compose**. The stack is **Node.js** (Express + Apollo GraphQL backend, Vite/React frontend), **MongoDB**, **Redis**, and **nginx**.

## Prerequisites

- [Git](https://git-scm.com/install/)
- [Docker Desktop](https://www.docker.com/) (Compose v2 included)
- [nvm](https://github.com/nvm-sh/nvm) (or another Node version manager)
- [pre-commit](https://pre-commit.com/#install) (optional but recommended; `brew install pre-commit` on macOS)

Supported bootstrap platforms: **macOS** and **Linux/WSL**.

## Quickstart

From the repo root:

```sh
bash apps/docs/src/getting-started/bootstrap-local.sh
```

Optional flags:

```sh
bash apps/docs/src/getting-started/bootstrap-local.sh --no-seed-db   # skip Mongo restore
bash apps/docs/src/getting-started/bootstrap-local.sh --no-docker    # deps + codegen only
```

When it finishes, open **http://localhost:3000**.

## Manual setup

If you prefer not to use the bootstrap script:

```sh
git pull
git switch main

nvm install --lts
pre-commit install   # optional

cp .env.template .env   # will not overwrite an existing .env

npm install
npx turbo run generate

docker compose up -d
```

App URL: **http://localhost:3000** (nginx proxies frontend + `/api`).

Stop the stack with:

```sh
docker compose down
```

Source is bind-mounted into the containers, so most backend/frontend edits hot-reload. After GraphQL schema changes, regenerate types:

```sh
npx turbo run generate
```

After adding npm packages that containers don’t pick up:

```sh
docker compose down
docker compose up --build -d
```

## What runs by default

`docker compose up -d` starts the **core stack**:

| Service     | Role                                      |
| ----------- | ----------------------------------------- |
| `nginx`     | Reverse proxy on port `3000`              |
| `frontend`  | Vite React app                            |
| `backend`   | Express + Apollo GraphQL                  |
| `datapuller`| Local scheduled SIS / catalog pullers     |
| `mongodb`   | MongoDB Atlas Local (data on port `3008`) |
| `redis`     | Cache / sessions (port `3004`)            |

Opt-in profiles (examples):

```sh
docker compose --profile staff up -d              # staff dashboard → :3002
docker compose --profile ag --profile staff up -d
docker compose --profile docs up -d               # docs / storybook
docker compose --profile semantic-search up -d
docker compose --profile dev up -d                # MinIO for staff photos
```

Default host ports use `DEV_PORT_PREFIX=30` (`3000`, `3004`, `3008`, …). To avoid clashes (e.g. worktrees):

```sh
DEV_PORT_PREFIX=80 docker compose up -d
```

Only prefixes `30` and `80` are fully supported for Google OAuth redirect URIs today.

## Environment

Copy `.env.template` → `.env` at the repo root. Compose injects this file into backend/datapuller. For local Docker networking, Mongo and Redis should stay as in the template, e.g.:

```env
MONGODB_URI=mongodb://mongodb:27017/bt?replicaSet=rs0
REDIS_URI=redis://redis:6379
```

SIS / Google / AWS keys can stay as `_` placeholders for basic UI work; live datapuller pulls need real SIS credentials.

## Seeding MongoDB

Some pages need data. The bootstrap script restores a **public** backup by default.

Manual restore (Mongo must already be up):

```sh
curl -f -o "prod-backup.gz" \
  "https://backups.berkeleytime.com/public/daily/prod_public_backup-$(TZ=America/Los_Angeles date -v -6H +%Y%m%d).gz"

docker cp ./prod-backup.gz berkeleytime-mongodb-1:/tmp/prod-backup.gz
# --drop only replaces collections present in the archive. Exclude local auth /
# user-owned data so a restore (especially a private dump) cannot wipe accounts.
docker exec berkeleytime-mongodb-1 mongorestore --drop --gzip \
  --archive=/tmp/prod-backup.gz \
  --nsExclude=bt.users \
  --nsExclude=bt.schedules \
  --nsExclude=bt.collections \
  --nsExclude=bt.pods \
  --nsExclude=bt.ratings \
  --nsExclude=bt.reviews \
  --nsExclude=bt.plans
```

Public backups are redacted. For fuller data, see [Fetch mongo backups](apps/docs/src/core/infrastructure/runbooks.md) (Cloudflare Access).

`mongodb-init` also seeds switchable local dev users on first boot (`docker/mongodb/init/02-seed-dev-users.js`).

## Catalog rebuild (optional)

If denormalized catalog search data looks wrong after puller changes:

```sh
npx tsx scripts/rebuild-catalog.ts
```

(Or run it inside a container that can reach Mongo with the same `MONGODB_URI`.)

## Maintainers / production

Production is deployed with Kubernetes/Helm under `infra/`. See `apps/docs/src/core/infrastructure/` for runbooks (backups, secrets, CronJobs, datapuller triggers).
