# Scripts Directory

This directory contains administrative and maintenance scripts for the Model Evaluation platform. These scripts handle data management, model synchronization, database operations, and system maintenance tasks.

## 📁 Script Overview

| Script                                                                     | Purpose                                       | Usage                     |
| -------------------------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| [`backfill-hierarchical-elo-scores.ts`](#backfill-hierarchical-elo-scores) | Recalculates ELO scores for hierarchical tags | Data migration & backfill |
| [`manage-model-availability.ts`](#manage-model-availability)               | Manages model availability status             | Model administration      |
| [`setup-test-db.sh`](#setup-test-database)                                 | Sets up test database for CI/CD               | Testing & development     |
| [`sync-openrouter-models.ts`](#sync-openrouter-models)                     | Syncs models from OpenRouter API              | Data synchronization      |

---

## 🔄 Backfill Hierarchical ELO Scores

**File:** `backfill-hierarchical-elo-scores.ts`

### Purpose

Processes all historical tournament data to calculate and populate hierarchical ELO scores for all models across all capability tags. This script is essential for migrating from legacy tag systems to the new hierarchical taxonomy.

### Features

- ✅ Processes tournaments chronologically to maintain ELO accuracy
- ✅ Updates scores for entire tag hierarchies (leaf tags + parent tags)
- ✅ Supports dry-run mode for safe testing
- ✅ Batch processing for performance
- ✅ Comprehensive error handling and statistics
- ✅ Can process specific tournaments or all tournaments

### Usage

```bash
# Basic usage - process all tournaments
tsx scripts/backfill-hierarchical-elo-scores.ts

# Dry run to preview changes
tsx scripts/backfill-hierarchical-elo-scores.ts --dry-run

# Process only first 10 tournaments (for testing)
tsx scripts/backfill-hierarchical-elo-scores.ts --limit=10 --verbose

# Reset all scores and rebuild from scratch
tsx scripts/backfill-hierarchical-elo-scores.ts --reset --verbose

# Process specific tournament
tsx scripts/backfill-hierarchical-elo-scores.ts --tournament-id=abc123

# Custom batch size for performance tuning
tsx scripts/backfill-hierarchical-elo-scores.ts --batch-size=5
```

### Options

- `--dry-run` - Preview changes without applying them
- `--limit=N` - Process only first N tournaments (for testing)
- `--batch-size=N` - Process tournaments in batches of N (default: 10)
- `--reset` - Clear all existing hierarchical scores before backfill
- `--verbose` - Show detailed progress information
- `--tournament-id=ID` - Process only specific tournament ID

### When to Use

- After implementing hierarchical tag system
- When ELO scores become inconsistent
- After major algorithm changes
- For data recovery scenarios

---

## 🤖 Manage Model Availability

**File:** `manage-model-availability.ts`

### Purpose

Administrative tool for managing model availability status. Handles models that become unavailable due to API failures, rate limits, or service disruptions.

### Features

- ✅ List all unavailable models with failure details
- ✅ View system-wide availability statistics
- ✅ Restore individual models to available status
- ✅ Bulk restore all unavailable models
- ✅ Track failure counts and timestamps
- ✅ Add restoration reasons for audit trail

### Usage

```bash
# List all currently unavailable models
pnpm models:unavailable
# or: tsx scripts/manage-model-availability.ts --list

# Show availability statistics
pnpm models:stats
# or: tsx scripts/manage-model-availability.ts --stats

# Restore a specific model
pnpm models:restore anthropic/claude-3-haiku "API key updated"
# or: tsx scripts/manage-model-availability.ts --restore anthropic/claude-3-haiku "API key updated"

# Restore all unavailable models
pnpm models:restore-all "System maintenance completed"
# or: tsx scripts/manage-model-availability.ts --restore-all "System maintenance completed"

# Show help
tsx scripts/manage-model-availability.ts --help
```

### Commands

- `--list` - Display all unavailable models with details
- `--stats` - Show system-wide availability metrics
- `--restore <model-id> [reason]` - Restore specific model
- `--restore-all [reason]` - Restore all unavailable models
- `--help` - Display usage information

### When to Use

- After API outages or service disruptions
- When models show consistent failures
- For routine availability monitoring
- Before major evaluations or tournaments

---

## 🗄️ Setup Test Database

**File:** `setup-test-db.sh`

### Purpose

Shell script that creates and configures a test database for CI/CD pipelines and local development testing.

### Features

- ✅ Creates test database if it doesn't exist
- ✅ Runs database migrations automatically
- ✅ Configurable database connection parameters
- ✅ Safe to run multiple times (idempotent)
- ✅ Proper error handling and logging

### Usage

```bash
# Basic usage with default test database
./scripts/setup-test-db.sh

# With custom database URL
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/my_test_db" ./scripts/setup-test-db.sh
```

### Environment Variables

- `TEST_DATABASE_URL` - Full database connection string (optional)
  - Default: `postgresql://test:test@localhost:5432/model_eval_test`

### When to Use

- Setting up CI/CD test environments
- Local development testing setup
- Before running test suites
- Database integration testing

---

## 🔄 Sync OpenRouter Models

**File:** `sync-openrouter-models.ts`

### Purpose

Synchronizes model data from the OpenRouter API to the local database. Keeps model information current including capabilities, context lengths, and availability status.

### Features

- ✅ Fetches latest model data from OpenRouter API
- ✅ Updates existing models and adds new ones
- ✅ Handles API rate limits with retry logic
- ✅ Tracks model creation dates and "new" status
- ✅ Preserves model statistics and metadata
- ✅ Robust error handling and progress reporting

### Usage

```bash
# Sync models from OpenRouter
pnpm sync:models
# or: tsx scripts/sync-openrouter-models.ts

# For development/testing
node --env-file=.env.development.local --import tsx scripts/sync-openrouter-models.ts
```

### Features

- **Automatic Updates**: Updates existing models with latest data
- **New Model Detection**: Marks models as "new" if created in last 30 days
- **Retry Logic**: Handles temporary API failures with exponential backoff
- **Progress Tracking**: Shows sync progress and success/failure counts
- **Data Preservation**: Maintains model statistics and evaluation history

### When to Use

- Daily/weekly scheduled sync (recommended)
- After OpenRouter adds new models
- When model metadata becomes stale
- Before major evaluation campaigns

---

## 🛠️ Configuration

### TypeScript Configuration

The scripts use their own TypeScript configuration (`tsconfig.json`) optimized for Node.js execution:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Environment Setup

Most scripts require proper environment configuration:

1. **Database Connection**: Ensure `DATABASE_URL` is set
2. **OpenRouter API**: Set `OPENROUTER_API_KEY` for model sync
3. **Development**: Use `.env.development.local` for local testing

---

## 📋 Best Practices

### Running Scripts Safely

1. **Always test with dry-run first** (when available)
2. **Backup database** before major operations
3. **Run during low-traffic periods** for performance-heavy scripts
4. **Monitor logs** for errors and warnings
5. **Use verbose mode** for debugging

### Scheduling Recommendations

- **Model Sync**: Daily at 2 AM UTC
- **ELO Backfill**: Only when needed (data migration)
- **Availability Check**: Every 4 hours
- **Test DB Setup**: As needed for CI/CD

### Error Handling

All scripts include comprehensive error handling:

- Detailed error messages and stack traces
- Graceful degradation for non-critical failures
- Progress preservation for resumable operations
- Statistics and summary reporting

---

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Verify environment variables
echo $DATABASE_URL
```

**OpenRouter API Issues**

```bash
# Test API key
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" https://openrouter.ai/api/v1/models

# Check rate limits in script output
```

**Permission Errors**

```bash
# Make shell scripts executable
chmod +x scripts/setup-test-db.sh
```

### Getting Help

- Check script output for detailed error messages
- Use `--verbose` flags for additional debugging info
- Review database logs for connection issues
- Verify environment variable configuration

---

## 📊 Monitoring & Logging

All scripts provide detailed logging including:

- **Progress Updates**: Real-time status of operations
- **Error Tracking**: Detailed error messages and stack traces
- **Performance Metrics**: Timing and throughput statistics
- **Summary Reports**: Final results and statistics

Example output:

```
🚀 Starting Hierarchical ELO Backfill
   Mode: LIVE UPDATE
   Batch Size: 10
   Tournaments: 58 found

✅ Completed tournament: GPT vs Claude (15 judged matches)
📊 Statistics:
   ⏱️  Duration: 45.2s
   🏆 Tournaments: 58
   🥊 Matches: 1,247
   🤖 Models: 23
   📝 Score Records: 2,891
```

This comprehensive logging helps with monitoring, debugging, and audit trails for all administrative operations.
