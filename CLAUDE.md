# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm dev:no-turbo     # Start development server without Turbopack
pnpm build            # Production build (requires DATABASE_URL)
pnpm start            # Start production server

# Quality Gates (ALL must pass before completing tasks)
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting without changes
pnpm types:check      # TypeScript type checking
pnpm test             # Run complete test suite
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report

# Quality Gate Combo (run before finishing any task)
pnpm lint && pnpm format:check && pnpm types:check && pnpm test && pnpm docs:check
```

### Database Commands
```bash
# Database operations
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:push          # Push schema changes without migrations
pnpm db:studio        # Open Drizzle Studio (visual database browser)

# Model management
pnpm sync:models      # Sync OpenRouter models to database
pnpm models:stats     # Show model availability statistics
pnpm models:restore   # Restore specific unavailable models
pnpm models:restore-all # Restore all models marked as unavailable
```

### Testing Commands
```bash
# Unit and integration tests
pnpm test             # Run all tests
pnpm test:watch       # Watch mode for TDD
pnpm test:coverage    # Coverage report (requires ≥80% global, ≥95% for API/lib)

# Single test file
pnpm test <file-path> # Run specific test file
```

### Documentation Commands
```bash
pnpm docs             # Generate TSDoc documentation
pnpm docs:check       # Validate TSDoc coverage (≥90% required)
```

## High-Level Architecture

### Core Technology Stack
- **Framework**: Next.js 15 with App Router + React 19
- **Language**: TypeScript 5.8+ (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4.x + shadcn/ui components
- **Authentication**: Privy (OAuth + Wallet)
- **AI Integration**: OpenRouter API (abstracted from users)
- **Package Manager**: pnpm 9.12.3+

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST with Zod validation)
│   ├── capabilities/      # Capability hierarchy pages
│   ├── eval/             # Tournament evaluation flows
│   ├── leaderboard/      # ELO leaderboards
│   ├── models/           # Model profiles and statistics
│   └── router/           # AI routing interface
├── components/           # UI components (shadcn/ui + custom)
├── lib/                  # Business logic and utilities
│   ├── auth/            # Privy authentication
│   ├── elo/             # ELO scoring system
│   ├── router/          # AI routing engine
│   ├── streaming-tournament/ # Tournament execution
│   └── taxonomy/        # Capability taxonomy
├── contracts/           # Zod schemas for API validation
├── types/              # TypeScript type definitions
└── db/                 # Database schema and migrations
```

### Key Domain Concepts

#### 1. Tournament System (Evaluation Engine)
- **Purpose**: Head-to-head AI model competitions
- **Flow**: Create → Execute → Judge → Update ELO
- **Components**: 
  - `Tournament` configurations with prompts and models
  - `TournamentRun` execution instances
  - `MatchResults` for ELO calculations
  - Bracket-style elimination (4, 8, or 16 models)

#### 2. Hierarchical ELO System
- **Innovation**: 151-tag capability taxonomy with separate ELO scores
- **Structure**: 6 Pillars → 27 Families → 118 Leaf Tags
- **Storage**: `model_tag_scores` table (1,760+ records)
- **Purpose**: Capability-specific model performance tracking

#### 3. AI Router System
- **Purpose**: Intelligent model selection based on real evaluation data
- **Process**: Prompt Analysis → Model Selection → Execution → Comparison
- **Types**: Single model recommendations + Multi-model workflows
- **Data**: Stores execution results in `router_execution_results`

#### 4. User Authentication
- **System**: Privy OAuth + Wallet authentication
- **Flow**: Login → JWT → User profile sync
- **Features**: Email, Google, GitHub, and wallet providers

### Database Schema Highlights

#### Core Tables
- `users` - Privy-synced user authentication
- `models` - OpenRouter model catalog with ELO scores
- `tournaments` - Evaluation configurations
- `tournament_runs` - Execution instances
- `match_results` - Head-to-head outcomes
- `model_tag_scores` - Hierarchical ELO ratings
- `router_execution_results` - Router execution data

#### Key Relationships
- Users create tournaments
- Tournament runs execute brackets
- Match results update ELO scores
- Model tag scores track capability-specific performance

### API Architecture

#### API Routes Structure
```
/api/
├── tournament/          # Tournament CRUD and execution
├── router/             # AI routing endpoints
├── models/             # Model data and statistics
├── leaderboard/        # ELO leaderboards
├── capability-analytics/ # Performance insights
└── user/               # User profiles and data
```

#### API Patterns
- **Validation**: All endpoints use Zod schemas
- **Authentication**: Privy JWT middleware for protected routes
- **Types**: Full TypeScript coverage with strict mode
- **Error Handling**: Structured error responses
- **Rate Limiting**: Implemented via OpenRouter

### Testing Strategy

#### Test Structure
```
__tests__/
├── unit/               # Business logic tests
├── components/         # UI component tests
├── api/               # API endpoint tests
├── integration/       # Cross-system tests
├── accessibility/     # WCAG compliance tests
└── performance/       # Performance benchmarks
```

#### Coverage Requirements
- **Global**: ≥80% coverage
- **API Routes**: ≥95% coverage (`src/app/api/**/*.ts`)
- **Business Logic**: ≥95% coverage (`src/lib/**/*.ts`)
- **TSDoc**: ≥90% documentation coverage

#### Testing Tools
- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Playwright
- **Accessibility**: jest-axe
- **Mocking**: MSW for API mocking

### Code Quality Standards

#### TypeScript Configuration
- **Strict Mode**: Enabled with `tsconfig.strict.json`
- **Path Mapping**: `@/` alias for `src/`
- **Type Safety**: 100% typed, no `any` allowed
- **Documentation**: TSDoc comments required

#### Code Organization
- **File Size**: Keep files under 200-300 lines
- **Single Responsibility**: One concern per file/function
- **Imports**: Organized with `simple-import-sort`
- **Naming**: Clear, descriptive names

#### Quality Gates
All must pass before completing any task:
1. **ESLint**: Custom rules + React hooks + import sorting
2. **Prettier**: Code formatting
3. **TypeScript**: Type checking with strict mode
4. **Tests**: Coverage thresholds met
5. **Documentation**: TSDoc coverage ≥90%

### Environment Setup

#### Local Development
```bash
# 1. Install dependencies
pnpm install

# 2. Set up database (choose one)
# Option A: Local PostgreSQL with Docker
docker run --name electric-pelican-db \
  -e POSTGRES_DB=electric_pelican \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 -d postgres:15

# Option B: Use Neon production database
# Configure DATABASE_URL in .env.local

# 3. Apply migrations
pnpm db:migrate

# 4. Start development
pnpm dev
```

#### Required Environment Variables
```env
# Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# Database
DATABASE_URL=postgresql://...

# AI Models
OPENROUTER_API_KEY=your_openrouter_key

# Router (Optional)
ROUTER_VERSION=1.0.0
```

### Development Workflow

#### Task Management
1. **Read** `.agent/goals.md` for context
2. **Create** tickets in `.agent/tickets/`
3. **Implement** with TDD approach
4. **Test** quality gates before completion
5. **Document** changes in `.agent/` files

#### Git Workflow
- Work on existing branch (avoid creating new branches)
- Commit after each logical change
- All quality gates must pass before merging
- Never push to production without human approval

#### Code Patterns

##### Component Structure
```typescript
// UI components use forwardRef pattern
const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("base-styles", className)}
        {...props}
      />
    );
  }
);
```

##### API Route Pattern
```typescript
// API routes with Zod validation
export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = schema.parse(body);
  
  // Business logic...
  
  return NextResponse.json(result);
}
```

##### Database Query Pattern
```typescript
// Type-safe database queries with Drizzle
const result = await db
  .select()
  .from(table)
  .where(eq(table.field, value))
  .limit(10);
```

### Important Notes

#### Model Abstraction
- Users never see "OpenRouter" branding
- All model execution is abstracted through internal APIs
- Model availability is tracked and managed automatically

#### ELO System
- Global ELO scores are stored directly on models table
- Hierarchical ELO scores are in separate `model_tag_scores` table
- ELO updates happen after every tournament match

#### Router Innovation
- First AI routing system powered by real evaluation data
- Combines single model recommendations with multi-model workflows
- Performance comparison helps users understand routing effectiveness

#### Security
- Never commit secrets or API keys
- All user input validated with Zod schemas
- Authentication required for protected routes
- XSS protection in content rendering

### Troubleshooting

#### Common Issues
1. **Database Connection**: Check Docker container or Neon connection
2. **Type Errors**: Run `pnpm types:check` for detailed errors
3. **Test Failures**: Check test setup and mocking
4. **Build Issues**: Ensure all quality gates pass

#### Debug Commands
```bash
# Database debugging
pnpm db:studio          # Visual database browser
docker logs electric-pelican-db  # Container logs

# Development debugging
pnpm dev:no-turbo       # Disable Turbopack if issues
pnpm test:coverage      # Check test coverage gaps
```

This architecture represents a breakthrough in AI evaluation and routing, combining real performance data with intelligent model selection to create the world's first evaluation-driven AI routing system.