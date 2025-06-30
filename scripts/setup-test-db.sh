#!/bin/bash

# Setup test database for CI/CD
# This script creates a test database and runs migrations

set -e

echo "Setting up test database..."

# Default test database URL
TEST_DB_URL=${TEST_DATABASE_URL:-"postgresql://test:test@localhost:5432/model_eval_test"}

echo "Using database URL: $TEST_DB_URL"

# Extract database components for createdb command
DB_HOST=$(echo $TEST_DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $TEST_DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $TEST_DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $TEST_DB_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $TEST_DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Set PGPASSWORD for createdb
export PGPASSWORD=$DB_PASS

# Create test database if it doesn't exist
echo "Creating test database: $DB_NAME"
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database $DB_NAME already exists"

# Run migrations on test database
echo "Running migrations on test database..."
DATABASE_URL=$TEST_DB_URL pnpm db:migrate

echo "Test database setup complete!"