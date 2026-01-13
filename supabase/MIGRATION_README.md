# Supabase Migration Guide for KCA Spark AI

## Quick Start

### 1. Set Up Environment Variables

Edit `supabase/.env` and add your Supabase credentials:

```bash
# Supabase API keys (from your Supabase dashboard > Settings > API)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_kF49B41jYdPsZJj_-dNcJw_4dbSflhW
SUPABASE_SERVICE_ROLE_KEY=sb_secret_7M-GDZBHIE3WOkTuohKs4A_65_0FvZ3

# Supabase URL (from your Supabase dashboard > Settings > API)
VITE_SUPABASE_URL=https://hpeqeqrqokgilpiylqqm.supabase.co
```

### 2. Run Migrations

#### Option A: Using the migration script (Recommended)
```bash
cd supabase
./migrate.sh
```

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
npm run supabase:login

# Push migrations to database
npm run supabase:migrate
```

#### Option C: Manual SQL Execution
Run the SQL files in order using Supabase Dashboard > SQL Editor:
1. `migrations/20251028062039_36bdefa2-536a-4699-b841-473f855210fd.sql`
2. `migrations/20251028062209_6f0d21d9-916d-46e0-8a5a-a728aadd8d45.sql`
3. `migrations/20251101000000_ai_chat_tables.sql`

### 3. Deploy Edge Functions

```bash
cd supabase
supabase functions deploy chat
```

### 4. Update TypeScript Types

```bash
npm run supabase:generate-types
```

### 5. Test the Application

```bash
npm run dev
```

---

## Environment Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public key for client-side | Frontend app |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for admin operations | Migrations, Edge Functions |
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend app |

---

## Migration Files

| File | Purpose |
|------|---------|
| `20251028062039_36bdefa2-536a-4699-b841-473f855210fd.sql` | Core tables (campuses, profiles, user_roles, chat, academic, financial, notifications) |
| `20251028062209_6f0d21d9-916d-46e0-8a5a-a728aadd8d45.sql` | RLS policies and security fixes |
| `20251101000000_ai_chat_tables.sql` | Enhanced chat features (settings, analytics) |

---

## Database Schema

### Core Tables
- `public.campuses` - Campus information
- `public.profiles` - User profiles
- `public.user_roles` - Role management (student, lecturer, admin)

### Chat System
- `public.chat_sessions` - Chat sessions
- `public.chat_messages` - Chat messages
- `public.chat_settings` - User chat preferences
- `public.chat_analytics` - Chat usage statistics

### Academic Data
- `public.units` - Courses/Units
- `public.timetable` - Class schedule
- `public.exam_schedules` - Exam schedules

### Financial Data
- `public.fee_structures` - Fee structures
- `public.student_fee_status` - Individual fee tracking

### Notifications
- `public.announcements` - System announcements
- `public.user_notifications` - User notification tracking

---

## Troubleshooting

### Migration Fails
1. Check that your Service Role Key has admin permissions
2. Ensure Supabase project is active
3. Verify network connectivity

### RLS Policy Errors
1. Run migrations as a user with admin privileges
2. Check that all tables are created before creating policies

### Edge Function Deployment Fails
1. Ensure Supabase CLI is installed and logged in
2. Check function code for syntax errors
3. Verify environment variables are set in Supabase

---

## Security Notes

⚠️ **Important Security Reminders:**

- Never commit `.env` files to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` confidential
- Only use Service Role Key for migrations and admin tasks
- Use Publishable Key for client-side code only

