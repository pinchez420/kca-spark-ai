#!/bin/bash

# Supabase Migration Script for KCA Spark AI
# This script runs all migrations in the correct order

echo "🚀 Starting Supabase Migration..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
else
    echo "❌ Error: .env file not found in supabase directory"
    exit 1
fi

# Check if required variables are set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env"
    exit 1
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: VITE_SUPABASE_URL not found in .env"
    exit 1
fi

# Extract project ID from URL (support both formats)
PROJECT_ID=$(echo $VITE_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||' | sed 's|/||')
echo "📦 Project ID: $PROJECT_ID"
echo "🌐 Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Migration files in order
MIGRATIONS=(
    "20251028062039_36bdefa2-536a-4699-b841-473f855210fd.sql"
    "20251028062209_6f0d21d9-916d-46e0-8a5a-a728aadd8d45.sql"
    "20251101000000_ai_chat_tables.sql"
)

echo "📋 Running ${#MIGRATIONS[@]} migrations..."
echo ""

# Run migrations
for migration in "${MIGRATIONS[@]}"; do
    echo "🔄 Running migration: $migration"
    
    # Check if migration file exists
    if [ ! -f "migrations/$migration" ]; then
        echo "❌ Error: Migration file not found: migrations/$migration"
        exit 1
    fi
    
    # Execute migration using Supabase CLI or direct SQL
    if command -v supabase &> /dev/null; then
        echo "   Using Supabase CLI..."
        # supabase db push --project-id $PROJECT_ID
        # Note: For direct SQL execution, use:
        psql "postgresql://postgres:$SUPABASE_SERVICE_ROLE_KEY@$PROJECT_ID.supabase.co:5432/postgres" -f "migrations/$migration" --quiet
    else
        echo "   Using direct SQL execution..."
        # Execute directly using psql
        psql "postgresql://postgres:$SUPABASE_SERVICE_ROLE_KEY@$PROJECT_ID.supabase.co:5432/postgres" -f "migrations/$migration" --quiet
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration completed: $migration"
    else
        echo "❌ Migration failed: $migration"
        exit 1
    fi
    echo ""
done

echo "✅ All migrations completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy Edge Functions: supabase functions deploy chat"
echo "2. Update TypeScript types: npm run supabase:generate-types"
echo "3. Test the application: npm run dev"

