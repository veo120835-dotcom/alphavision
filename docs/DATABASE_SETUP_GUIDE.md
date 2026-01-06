# 🗄️ Database Setup Guide

## Current Status

**⚠️ Database is EMPTY** - No tables have been created yet.

The migrations exist in the project but haven't been applied to your Supabase database.

## What's Missing

Your database currently has:
- ✅ Connection established
- ❌ No tables
- ❌ No RLS policies
- ❌ No admin user
- ❌ No default organization

## How to Fix This

### Option 1: Apply Comprehensive Setup (RECOMMENDED)

I've created a complete database setup file that includes everything:

**File**: `/project/COMPREHENSIVE_DB_SETUP.sql`

**What it includes**:
- 20+ core tables (organizations, users, profiles, memberships)
- CRM tables (contacts, companies, deals, leads)
- Revenue tables (invoices, revenue_events, credits)
- Agent tables (decisions, sessions, agent_states)
- New feature tables (idempotency_keys, rate_limit_records, marketplace)
- RLS policies for all tables
- Indexes for performance
- Triggers for updated_at
- Helper functions
- Default demo organization with 100 free credits

**Steps**:

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste SQL**
   - Open `/project/COMPREHENSIVE_DB_SETUP.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run" (or Cmd/Ctrl + Enter)

4. **Wait for completion** (~10-30 seconds)

5. **Verify tables created**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   You should see 20+ tables listed.

### Option 2: Apply Existing Migrations One-by-One

If you prefer to use the original migration files:

1. **Open Supabase Dashboard → SQL Editor**

2. **Apply migrations in order**:

   **Migration 1**: Extensions & Basic Setup
   ```bash
   # File: supabase/migrations/20260106200325_remix_migration_from_pg_dump.sql
   # Just extensions, very quick
   ```

   **Migration 2**: Prompt & Client System
   ```bash
   # File: supabase/migrations/20260106173456_83c7bf82-65e1-40c9-972f-7f79a515c89e.sql
   # Creates: clients, prompt_templates, prompt_runs, memories
   ```

   **Migration 3**: Core Business Tables
   ```bash
   # File: supabase/migrations/20260106200821_62f4e8d7-2189-4c43-b60e-3f9f61a782d9.sql
   # Creates: organizations, memberships, business_config, permission_contracts, etc.
   ```

   **Migration 4**: Updated At Function
   ```bash
   # File: supabase/migrations/20260106200839_5c71ca46-d978-493e-920f-280bf6874ba6.sql
   # Creates handle_updated_at() function
   ```

   **Migration 5**: Agent & Decision System
   ```bash
   # File: supabase/migrations/20260106203734_750c6d83-6afd-43bb-b93f-7ffcae935b32.sql
   # Creates: profiles, user_roles, sessions, decisions, agent_states, leads, revenue_events
   ```

3. **Then add missing tables** (copy from COMPREHENSIVE_DB_SETUP.sql):
   - idempotency_keys
   - rate_limit_records
   - lead_listings
   - marketplace_transactions
   - credit_transactions
   - contacts
   - companies
   - deals
   - invoices
   - bookings
   - booking_types

4. **Add RLS policies** (copy from COMPREHENSIVE_DB_SETUP.sql)

## After Database Setup

### Create Admin User

**Option A: Via Supabase Dashboard**

1. Go to **Authentication → Users**
2. Click "Add User"
3. Enter email and password
4. Copy the new User ID

5. **Link to organization**:
   ```sql
   -- Get the demo org ID
   SELECT id, name FROM organizations;

   -- Add user to org as admin
   INSERT INTO memberships (user_id, organization_id, role)
   VALUES ('PASTE_USER_ID_HERE', 'PASTE_ORG_ID_HERE', 'admin');

   -- Add admin role
   INSERT INTO user_roles (user_id, role)
   VALUES ('PASTE_USER_ID_HERE', 'admin');

   -- Create profile
   INSERT INTO profiles (id, email, full_name)
   VALUES ('PASTE_USER_ID_HERE', 'your@email.com', 'Your Name');
   ```

**Option B: Via SQL Function** (After setup)

```sql
-- Create organization and get ID
SELECT setup_admin_user('admin@example.com', 'password123', 'My Company');
```

Then create the user via Auth UI and follow instructions in the returned JSON.

### Verify Everything Works

```sql
-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 20+

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All should have rowsecurity = true

-- Check organizations
SELECT * FROM organizations;
-- Should see "Alpha Vision Demo"

-- Check credit account
SELECT * FROM decision_credits;
-- Should see 100 credit balance
```

## Common Issues & Solutions

### Issue: "relation already exists"
**Solution**: Some tables already exist. Either:
- Skip that CREATE TABLE statement
- Use `CREATE TABLE IF NOT EXISTS` (already in COMPREHENSIVE_DB_SETUP.sql)
- Drop and recreate: `DROP TABLE IF EXISTS table_name CASCADE;`

### Issue: "type already exists"
**Solution**: ENUM type already created. Either:
- Skip the CREATE TYPE statement
- Use `DROP TYPE IF EXISTS app_role CASCADE;` first

### Issue: "permission denied for schema public"
**Solution**: Make sure you're running as postgres user or service_role

### Issue: RLS blocks data access
**Solution**:
1. Check you're authenticated as a user
2. Verify user has membership in organization
3. Check RLS policies are correct
4. For testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;` (NOT for production)

## What Happens After Setup

Once database is set up, you'll have:

✅ **20+ Tables** ready for use
✅ **RLS Security** enabled on all tables
✅ **Default Organization** with 100 free credits
✅ **Indexed** for performance
✅ **Triggers** for auto-updating timestamps
✅ **Helper Functions** for common operations

The frontend will immediately work because:
- All tables match the TypeScript types
- All queries in components will succeed
- Real-time subscriptions will work
- RLS will enforce proper access control

## Next Steps After Database Setup

1. ✅ Create your admin user (see above)
2. ✅ Log into the app
3. ✅ You'll see the demo organization
4. ✅ Test creating a contact or company
5. ✅ Move to external service setup (n8n, Stripe)

## Database Schema Summary

```
Core Tables:
├── organizations (your workspace)
├── memberships (user ↔ org links)
├── profiles (user details)
└── user_roles (admin, moderator, user)

CRM Tables:
├── contacts
├── companies
├── deals
└── leads

Revenue Tables:
├── invoices
├── revenue_events
├── decision_credits
└── credit_transactions

Agent Tables:
├── sessions
├── decisions
├── decision_outcomes
└── agent_states

Booking Tables:
├── booking_types
└── bookings

Marketplace Tables:
├── lead_listings
└── marketplace_transactions

Infrastructure Tables:
├── idempotency_keys
├── rate_limit_records
└── notifications
```

## Questions?

If you run into issues:
1. Check the error message carefully
2. Verify you're in the correct Supabase project
3. Make sure you're using the SQL Editor as postgres/service_role
4. Try COMPREHENSIVE_DB_SETUP.sql first (it has IF NOT EXISTS checks)

---

**Status**: Database empty, waiting for setup
**Estimated Time**: 5 minutes
**Priority**: 🔴 HIGH - Required before app will work
