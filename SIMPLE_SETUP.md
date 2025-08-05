# Simple FinMate Database Setup

## The Problem
Your error shows: `ERROR: relation "roles" does not exist`

This means the database schema didn't execute completely. Let's fix this step by step.

## Step-by-Step Setup

Execute these files **one by one** in your Supabase SQL Editor:

### Step 1: Types and Extensions
Copy and paste the entire content from:
```
database/step_by_step_setup.sql
```
Click "Run" and wait for success.

### Step 2: Core Tables (Most Important)
Copy and paste the entire content from:
```
database/step2_core_tables.sql
```
Click "Run" and wait for success.

### Step 3: Seed Data
Copy and paste the entire content from:
```
database/step3_seed_data.sql
```
Click "Run" and wait for success.

### Step 4: Functions and Triggers
Copy and paste the entire content from:
```
database/step4_functions.sql
```
Click "Run" and wait for success.

### Step 5: Security Policies
Copy and paste the entire content from:
```
database/step5_rls_policies.sql
```
Click "Run" and wait for success.

### Step 6: Application Tables (Optional for now)
Copy and paste the entire content from:
```
database/step6_remaining_tables.sql
```
Click "Run" and wait for success.

## Test User Registration

After completing steps 1-5, try registering a user:

1. Go to `/auth/signup`
2. Register with your email
3. Should work without errors
4. First user becomes admin automatically

## Verification

After step 2, check if tables exist:
1. Go to Supabase Dashboard → Table Editor
2. You should see: `roles`, `permissions`, `role_permissions`, `profiles`

If you see these tables, the core setup is working!

## Why This Approach Works

- **Smaller chunks**: Less chance of SQL transaction failures
- **Dependencies resolved**: Tables created in correct order
- **Error isolation**: If one step fails, you know exactly where
- **Minimal setup**: Steps 1-5 are enough for authentication

## If Still Getting Errors

1. Check Supabase logs for specific SQL errors
2. Make sure each step completed successfully  
3. Verify tables exist in Table Editor
4. Try registering after each step to pinpoint the issue

The key is that after Step 4, user registration should work because:
- `roles` table exists ✅
- `profiles` table exists ✅  
- Trigger `handle_new_user()` exists ✅
- Default roles are inserted ✅