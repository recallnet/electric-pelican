# Electric Pelican 🦾

A powerful platform for running head-to-head AI model evaluations with automated judging and intelligent AI routing based on real performance data.

## 🌟 Overview

Electric Pelican is evolving from a tournament-style evaluation platform into the **world's first intelligent AI routing system** powered by real evaluation data. The platform combines:

- **Evaluation Engine**: Tournament-style head-to-head model competitions
- **Hierarchical ELO System**: Capability-specific scoring across 151 taxonomy tags
- **Intelligent Router**: Automatic model selection based on performance data
- **Real-time Analytics**: Performance insights and routing effectiveness

### Key Capabilities

- 3-step wizard for evaluation creation (4, 8, or 16 model brackets)
- Automated AI judging with detailed explanations
- Real-time progress tracking and results visualization
- **NEW**: Intelligent prompt analysis and workflow decomposition
- **NEW**: ELO-based model routing across capability hierarchies
- **NEW**: Multi-model workflow execution with performance comparison
- Public sharing, social features (upvoting, forking, versioning)

## 🏗️ Architecture Overview

### System Architecture

Electric Pelican follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router  │  React 19  │  TypeScript Strict  │
│  Tailwind + shadcn/ui   │  Real-time │  Accessibility      │
│                         │  Updates   │  (WCAG 2.1 AA)      │
├─────────────────────────────────────────────────────────────┤
│                     API & ROUTING LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Tournament APIs        │  Router APIs        │  Analytics │
│  /api/tournament/*      │  /api/router/*      │  /api/...  │
│  CRUD, Execution        │  Analysis, Execute  │  Insights  │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Tournament Engine      │  Router Engine      │  ELO System│
│  ├─ Bracket Logic       │  ├─ Prompt Analysis │  ├─ Global │
│  ├─ Judge Management    │  ├─ Model Selection │  ├─ Tags   │
│  ├─ Progress Tracking   │  ├─ Workflow Exec   │  └─ Updates│
│  └─ Result Processing   │  └─ Comparison      │            │
├─────────────────────────────────────────────────────────────┤
│                      DATA ACCESS LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Drizzle ORM           │  Type-Safe Queries  │  Migrations │
│  PostgreSQL Schema     │  Connection Pool    │  Indexing  │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL INTEGRATIONS                    │
├─────────────────────────────────────────────────────────────┤
│  OpenRouter API        │  Privy Auth         │  Vercel    │
│  Model Execution       │  OAuth + Wallet     │  Hosting   │
│  Rate Limiting         │  Session Mgmt       │  Analytics │
└─────────────────────────────────────────────────────────────┘
```

### Core Domain Models

#### 1. **Tournament System** (Established)

```typescript
Tournament → TournamentRun → MatchResults → ELO Updates
     ↓              ↓             ↓            ↓
   Config      Execution     Head-to-Head   Scoring
   Models      Progress      Judging        Global+Tags
   Prompts     Bracket       Winners        Historical
```

#### 2. **Router System** (New - Phase 3 Complete)

```typescript
Prompt → Analysis → ModelSelection → Execution → Results
  ↓        ↓           ↓              ↓          ↓
Input   Workflow   ELO-Based      Parallel    Comparison
Text    Decomp     Routing        Single+     Performance
        Tags       Capability     Workflow    Insights
```

#### 3. **Hierarchical ELO System** (Complete)

```typescript
6 Pillars → 27 Families → 118 Leaf Tags → Model Scores
    ↓           ↓             ↓              ↓
Reasoning   Creative      Specific        Tag-Specific
Technical   Analysis      Capabilities    ELO Ratings
Communication Planning   Implementation   Win/Loss
```

### Technology Stack

#### **Frontend Architecture**

- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript 5.8+ (Strict Mode)
- **Styling**: Tailwind CSS 4.x + shadcn/ui component system
- **State Management**: React Context + Server Components
- **Real-time**: Server-Sent Events for progress tracking
- **Accessibility**: WCAG 2.1 AA compliance with jest-axe

#### **Backend Architecture**

- **API Layer**: Next.js API Routes with Zod validation
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Privy (OAuth + Wallet) with JWT rotation
- **Model Integration**: OpenRouter API (abstracted from users)
- **Background Jobs**: Queue-based processing for long-running tasks

#### **Data Architecture**

```sql
-- Core Tables
users                    -- Privy-synced user data
models                   -- OpenRouter model catalog + ELO
tournaments             -- Evaluation configurations
tournament_runs         -- Execution instances
match_results          -- Head-to-head outcomes

-- ELO System
model_tag_scores       -- Hierarchical capability ratings
-- 1,760+ records across 151 taxonomy tags

-- Router System (New)
router_execution_results -- Router execution data + model ELO
-- Simplified persistence with focused model data
```

### Key Architectural Decisions

#### **1. Hierarchical ELO Innovation**

- **Problem**: Generic model ratings don't reflect capability-specific performance
- **Solution**: 151-tag taxonomy with separate ELO scores per capability
- **Impact**: Enables intelligent routing based on task-specific model strengths

#### **2. Router Architecture**

- **Workflow Engine**: Multi-step task decomposition with dependency management
- **Model Selection**: ELO-based routing using capability-specific scores
- **Execution**: Parallel single + workflow execution for performance comparison
- **Persistence**: Simplified model ELO data capture (not full snapshots)

#### **3. Abstraction Layers**

- **Model Provider**: Users never see "OpenRouter" - clean, branded experience
- **Authentication**: Unified OAuth + Wallet login via Privy
- **Database**: Type-safe queries with Drizzle, automatic migrations

#### **4. Performance Optimizations**

- **Database**: Strategic indexing on ELO scores, model availability, user queries
- **API**: Efficient caching, pagination, and query optimization
- **Frontend**: Server Components, streaming, and progressive enhancement

### Security Architecture

#### **Authentication & Authorization**

```typescript
Request → Privy JWT → Token Verification → User Context
   ↓         ↓            ↓                    ↓
Headers   Validation   Role Check         Database
Cookies   JWKS/HMAC    Permissions        User Record
```

#### **Data Protection**

- **Secrets**: Environment variables, never committed
- **Sessions**: HttpOnly cookies with automatic rotation
- **Input**: Zod schema validation on all endpoints
- **Output**: XSS prevention in content rendering

### Deployment Architecture

#### **Infrastructure**

- **Hosting**: Vercel with automatic deployments
- **Database**: Neon PostgreSQL with connection pooling
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Built-in Vercel analytics + custom metrics

#### **Environments**

```
Development → Staging → Production
     ↓          ↓          ↓
Local DB   Preview DB   Neon Prod
Mock APIs  Test APIs    Live APIs
Dev Keys   Test Keys    Prod Keys
```

### Quality Architecture

#### **Testing Strategy**

- **Unit**: Business logic, utilities (`__tests__/unit/`)
- **Component**: UI with React Testing Library (`__tests__/components/`)
- **API**: Endpoint testing with MSW (`__tests__/api/`)
- **Integration**: Cross-cutting features (`__tests__/integration/`)
- **E2E**: Critical user flows with Playwright
- **Accessibility**: Automated WCAG compliance testing

#### **Code Quality**

- **Linting**: ESLint + Prettier with strict rules
- **Types**: TypeScript strict mode, 99% TSDoc coverage
- **Performance**: Bundle analysis, Core Web Vitals monitoring
- **Security**: Dependency scanning, secret detection

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9.12.3
- Docker (for local PostgreSQL)
- OpenRouter API Key
- Privy API Keys

### Database Setup Options

You can use either a **local PostgreSQL instance** (recommended for development) or connect to the **Neon production database**.

#### Option 1: Local PostgreSQL with Docker (Recommended)

1. **Start PostgreSQL container:**

   ```bash
   # Create and start PostgreSQL container
   docker run --name electric-pelican-db \
     -e POSTGRES_DB=electric_pelican \
     -e POSTGRES_USER=dev_user \
     -e POSTGRES_PASSWORD=dev_password \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Configure environment variables:**
   Add to your `.env.local`:

   ```env
   # Local PostgreSQL Database
   DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/electric_pelican"
   ```

3. **Initialize database schema:**

   ```bash
   # Apply all migrations to create tables and indexes
   pnpm db:migrate

   # Verify schema is correctly applied
   pnpm db:studio  # Opens Drizzle Studio at http://localhost:4983
   ```

4. **Optional: Seed with sample data:**
   ```bash
   # Run any seed scripts (if available)
   pnpm db:seed
   ```

#### Option 2: Neon Production Database

1. **Get your Neon connection string** from the Neon console
2. **Configure environment variables:**
   Add to your `.env.local`:
   ```env
   # Neon Production Database
   DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"
   ```

### Environment Setup

1. Clone the repository
2. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
3. Configure required environment variables:

   ```env
   # Authentication
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_secret

   # Database (choose one option above)
   DATABASE_URL=your_database_connection_string

   # AI Models
   OPENROUTER_API_KEY=your_openrouter_key

   # Router Features (Optional)
   ROUTER_VERSION=1.0.0          # Version tracking
   ```

### Local Development Workflow

```bash
# 1. Start PostgreSQL (if using Docker)
docker start electric-pelican-db

# 2. Install dependencies
pnpm install

# 3. Apply database migrations
pnpm db:migrate

# 4. Start development server
pnpm dev

# 5. Open application
# Navigate to http://localhost:3000
```

### Database Management Commands

```bash
# Database Operations
pnpm db:generate     # Generate new migration from schema changes
pnpm db:migrate      # Apply pending migrations
pnpm db:studio       # Open Drizzle Studio (database GUI)
pnpm db:drop         # Drop all tables (destructive!)

# Check database status
pnpm db:check        # Verify connection and schema
```

### Docker PostgreSQL Management

```bash
# Container lifecycle
docker start electric-pelican-db    # Start existing container
docker stop electric-pelican-db     # Stop container
docker restart electric-pelican-db  # Restart container

# Database management
docker exec -it electric-pelican-db psql -U dev_user -d electric_pelican
# This opens PostgreSQL CLI for direct database access

# View logs
docker logs electric-pelican-db

# Remove container (destructive!)
docker rm electric-pelican-db
```

### Database Schema Verification

After setting up your database, verify the schema is correctly applied:

```bash
# 1. Open Drizzle Studio
pnpm db:studio

# 2. Check for these core tables:
# ✅ users                    - User authentication data
# ✅ models                   - AI model catalog with ELO scores
# ✅ tournaments              - Evaluation configurations
# ✅ tournament_runs          - Execution instances
# ✅ match_results           - Head-to-head match outcomes
# ✅ model_tag_scores        - Hierarchical ELO ratings (1,760+ records)
# ✅ router_execution_results - Router execution data (new)

# 3. Verify indexes are created:
# - ELO score indexes for performance
# - User and tournament relationship indexes
# - Search and filtering indexes
```

### Troubleshooting Database Setup

#### **Connection Issues**

```bash
# Test database connection
pnpm db:check

# Common fixes:
# 1. Ensure PostgreSQL container is running
docker ps | grep electric-pelican-db

# 2. Verify connection string format
echo $DATABASE_URL

# 3. Check Docker networking
docker exec electric-pelican-db pg_isready -U dev_user
```

#### **Migration Issues**

```bash
# Reset migrations (destructive!)
pnpm db:drop
pnpm db:migrate

# Check migration status
pnpm db:studio
# Look for "__drizzle_migrations" table
```

#### **Performance Issues**

```bash
# Verify indexes are created
docker exec -it electric-pelican-db psql -U dev_user -d electric_pelican -c "\di"

# Check table sizes
docker exec -it electric-pelican-db psql -U dev_user -d electric_pelican -c "
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public';"
```

### Development Commands

```bash
# Installation
pnpm install

# Development
pnpm dev         # Start dev server (localhost:3000)
pnpm test        # Run complete test suite
pnpm test:watch  # Watch mode for TDD

# Quality Checks
pnpm lint        # ESLint + Prettier
pnpm types:check # TypeScript validation
pnpm docs:check  # TSDoc coverage verification

# Database
pnpm db:generate # Generate migrations
pnpm db:migrate  # Apply migrations
pnpm db:studio   # Visual database browser

# Production
pnpm build       # Production build
pnpm start       # Start production server
```

## 🧪 Testing Philosophy

Electric Pelican follows **Test-Driven Development** with comprehensive coverage:

- **90%+ Unit Test Coverage**: All business logic thoroughly tested
- **Component Testing**: Every UI component with accessibility checks
- **API Contract Testing**: All endpoints with request/response validation
- **Integration Testing**: Cross-system feature verification
- **Performance Testing**: Core Web Vitals and load testing

## 📚 For AI Agents & Developers

### Key Navigation Points

- **API Endpoints**: `src/app/api/` - RESTful APIs with Zod validation
- **Business Logic**: `src/lib/` - Core domain logic and utilities
- **Database**: `db/schema.ts` - Complete schema with relationships
- **Types**: `src/types/` - TypeScript definitions for all domains
- **Components**: `src/components/` - Reusable UI components

### Important Contexts

- **Terminology**: User-facing "evaluations", internal "tournaments"
- **Model Abstraction**: OpenRouter powers execution but is hidden from users
- **ELO System**: 151 hierarchical tags for capability-specific scoring
- **Router Innovation**: First evaluation-driven AI routing system

### Development Patterns

- **API-First**: All features start with API design and testing
- **Type Safety**: Strict TypeScript with comprehensive type definitions
- **Accessibility**: WCAG 2.1 AA compliance from the start
- **Performance**: Server Components, streaming, efficient queries

## 🌟 Innovation Highlights

### **World's First Evaluation-Driven Router**

Electric Pelican represents a breakthrough in AI routing technology:

1. **Real Performance Data**: Routing decisions based on actual head-to-head evaluations, not heuristics
2. **Capability-Specific Intelligence**: 151-tag hierarchy enables precise task-to-model matching
3. **Continuous Learning**: ELO scores update with every evaluation, improving routing accuracy
4. **Workflow Optimization**: Intelligent task decomposition with multi-model coordination

### **Technical Achievements**

- **1,760+ Hierarchical ELO Records**: Complete historical data backfill
- **Type-Safe Full Stack**: End-to-end TypeScript with strict validation
- **Accessibility First**: WCAG 2.1 AA compliance throughout
- **Performance Optimized**: Core Web Vitals excellence with modern architecture

## 📖 Additional Documentation

- `.agent/goals.md` - Complete product specification and roadmap
- `.agent/styles.md` - Design system and UI guidelines
- `.agent/openrouter.md` - Model integration technical details
- `.agent/tickets/` - Implementation tickets and progress tracking

---

**Electric Pelican** - Transforming AI model evaluation into intelligent routing through real performance data.
