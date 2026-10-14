# Electric Pelican

Electric Pelican is an experimental web application for comparing language models and using those evaluations to guide model selection. It combines head-to-head tournaments, capability-specific Elo ratings, and a router that recommends a single model or coordinates a workflow across multiple models.

This repository preserves a research prototype for reference. It is not a maintained service, and the presence of an implementation or test does not establish production readiness or improved routing quality.

## What it contains

- **Model evaluations:** bracket-based comparisons, model-generated judging, and streamed tournament progress.
- **Capability ratings:** global and hierarchical Elo scores organized by a capability taxonomy.
- **Model routing:** prompt analysis, capability matching, model selection, workflow execution, and result comparison.
- **Web interface:** evaluations, model profiles, leaderboards, capability exploration, and a router interface, with Privy authentication.

The application uses Next.js 15, React 19, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Privy, and OpenRouter. Model execution and judging require external services and can incur API charges.

## Repository layout

| Path                                   | Contents                                             |
| -------------------------------------- | ---------------------------------------------------- |
| `src/app/`                             | Pages and API routes                                 |
| `src/components/`                      | Interface components                                 |
| `src/lib/streaming-tournament/`        | Tournament execution and judging                     |
| `src/lib/elo/` and `src/lib/taxonomy/` | Ratings and capability taxonomy                      |
| `src/lib/router/`                      | Model selection and workflow execution               |
| `db/`                                  | Drizzle schema, migrations, and Neon database client |
| `src/db/`                              | Additional database schema and PostgreSQL client     |
| `__tests__/` and `tests-types/`        | Runtime and type tests                               |
| `.agent/`                              | Historical project notes and specifications          |

Historical notes describe intended behavior as well as implemented work; they are not a guarantee of current functionality.

## Running the prototype

The original CI configuration uses Node.js 20 and pnpm 9.12.3. These are historical environment versions, not a statement of current support.

The main database client in `db/index.ts` uses Neon's HTTP driver. Use a dedicated Neon development database for that code path. A plain local PostgreSQL server is not a drop-in replacement for the Neon HTTP endpoint. The SQLite-style URL in `.env.example` does not match the application's PostgreSQL configuration.

Install the dependencies and create a local environment file:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Replace the template values with your own configuration. The authentication implementation reads the following names; some differ from the historical template:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
PRIVY_JWKS_ENDPOINT=https://your-privy-jwks-endpoint
OPENROUTER_API_KEY=your-openrouter-api-key
```

Use the JWKS endpoint supplied by your Privy configuration. Keep credentials in the untracked local environment file. Database migrations use `drizzle.config.ts`, which reads `DATABASE_URL` from the process environment; load `.env.local` explicitly:

```sh
node --env-file=.env.local node_modules/drizzle-kit/bin.cjs migrate
pnpm sync:models
pnpm dev
```

Model synchronization writes the provider's model catalog to your database. Open the application at `http://localhost:3000` and configure the corresponding origin in your Privy application. A new database does not include historical evaluation results or capability ratings.

## Development commands

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Start the development server with Turbopack |
| `pnpm dev:no-turbo` | Start without Turbopack                     |
| `pnpm test`         | Run Jest tests                              |
| `pnpm types:check`  | Run TypeScript and type assertion checks    |
| `pnpm lint`         | Run the configured lint command             |
| `pnpm format:check` | Check formatting                            |
| `pnpm docs:check`   | Run TypeDoc validation                      |
| `pnpm db:generate`  | Generate migrations from the schema         |
| `pnpm db:studio`    | Open Drizzle Studio                         |
| `pnpm build`        | Build the application                       |
| `pnpm start`        | Start the built application                 |

These commands are preserved from the prototype. They do not imply that the current checkout passes every check. The build script supplies a dummy database URL, and the prebuild script skips quality checks; a build is not a substitute for running the checks separately.
