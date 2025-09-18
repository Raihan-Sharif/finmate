# 🗄️ Supabase Database Schema Backup

**Last Updated:** $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**Project ID:** $SUPABASE_PROJECT_ID
**Backup Location:** `database/backup/`
**🎯 IMPROVED:** Clean backup with automatic deduplication and PostgreSQL-native processing

## 📁 Directory Structure

```
database/backup/
├── schema/                     # Complete database schema dumps
│   ├── complete_schema.sql     # Full schema dump (ALL components)
│   ├── public_schema.sql       # Public schema only
│   ├── auth_schema.sql         # Authentication schema
│   ├── storage_schema.sql      # Storage schema
│   ├── extensions_schema.sql   # Extensions schema
│   └── reference_data.sql      # Sample data (non-sensitive)
├── functions/                  # User-defined database functions and edge functions
│   ├── database_functions.sql  # User-defined database functions only
│   └── function_signatures.txt # User function signatures documentation
├── policies/                   # Row Level Security policies
│   ├── rls_policies.sql        # All RLS policies
│   └── policy_summary.txt      # Policy documentation
├── triggers/                   # Database triggers
│   ├── triggers.sql            # All triggers
│   └── trigger_functions.sql   # Trigger functions
├── views/                      # Database views
│   └── views.sql               # All views
├── types/                      # Custom types and enums
│   └── custom_types.sql        # All custom types
├── sequences/                  # Database sequences
│   └── sequences.sql           # All sequences
├── indexes/                    # Database indexes
│   └── indexes.sql             # All custom indexes
└── migrations/                 # Supabase migrations
```

## 📊 Schema Statistics

**Tables:** $(cat database/backup/schema/complete_schema.sql | grep -c "CREATE TABLE" || echo "0")
**Functions:** $(cat database/backup/schema/complete_schema.sql | grep -c "CREATE OR REPLACE FUNCTION" || echo "0")
**Policies:** $(cat database/backup/policies/rls_policies.sql | grep -c "CREATE POLICY" || echo "0")
**Triggers:** $(cat database/backup/triggers/triggers.sql | grep -c "CREATE TRIGGER" || echo "0")
**Views:** $(cat database/backup/views/views.sql | grep -c "CREATE VIEW\|CREATE OR REPLACE VIEW" || echo "0")
**Custom Types:** $(cat database/backup/types/custom_types.sql | grep -c "CREATE TYPE\|CREATE DOMAIN" || echo "0")
**Sequences:** $(cat database/backup/sequences/sequences.sql | grep -c "CREATE SEQUENCE" || echo "0")
**Indexes:** $(cat database/backup/indexes/indexes.sql | grep -c "CREATE.*INDEX" || echo "0")

## 🚀 Usage Instructions

### Full Schema Restore
To restore complete schema to a new Supabase project:
```bash
# 1. Create new Supabase project
# 2. Reset database (if needed)
supabase db reset

# 3. Apply complete schema
psql -h your-db-host -U postgres -d postgres -f database/backup/schema/complete_schema.sql
```

### Component-wise Restore
Apply specific components:
```bash
# Apply only functions
psql -f database/backup/functions/database_functions.sql

# Apply only policies
psql -f database/backup/policies/rls_policies.sql

# Apply only triggers
psql -f database/backup/triggers/triggers.sql
```

## 🔧 Backup Components

This backup includes ALL database components:
- ✅ **Tables** - All table definitions and constraints
- ✅ **Functions** - User-defined database functions and edge functions (system functions excluded)
- ✅ **Policies** - Row Level Security (RLS) policies
- ✅ **Triggers** - All triggers and trigger functions
- ✅ **Views** - All database views
- ✅ **Types** - Custom types and enums
- ✅ **Sequences** - Auto-increment sequences
- ✅ **Indexes** - Performance indexes
- ✅ **Extensions** - PostgreSQL extensions
- ✅ **Migrations** - Supabase migration history

## 📝 Notes

- 🤖 **Automated**: Generated nightly at 2:00 AM UTC by GitHub Actions
- 🔧 **Manual Trigger**: Available from the Actions tab
- 🔒 **Security**: Sensitive data (auth tables) excluded from reference data
- 📊 **Monitoring**: Detailed backup reports in GitHub Actions summaries
- 🔄 **Version Control**: All changes tracked in git history

## 🆘 Support

If restoration fails:
1. Check PostgreSQL version compatibility
2. Ensure all required extensions are available
3. Review error logs for missing dependencies
4. Apply schema components in order: extensions → types → tables → functions → policies → triggers → views
