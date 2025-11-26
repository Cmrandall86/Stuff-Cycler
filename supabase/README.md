# Supabase Directory

This directory contains all Supabase-related configuration, migrations, functions, and documentation for the Stuff Cycler project.

## Structure

```
supabase/
├── archive-debug-scripts/    # Historical debugging scripts (reference only)
├── functions/                 # Supabase Edge Functions
│   ├── admin-users/          # Admin user management
│   └── send-group-invitation/ # Group invitation handling
├── migrations/                # Database migrations (applied in order)
├── backfill-profiles.sql     # Script to backfill user profiles
├── bootstrap.sql             # Initial database setup and schema
├── config.toml               # Supabase CLI configuration
├── DEPLOY_EDGE_FUNCTION.md   # Instructions for deploying edge functions
└── storage-buckets.md        # Storage bucket configuration documentation
```

## Key Files

### `config.toml`
Supabase CLI configuration for local development and deployment.

### `bootstrap.sql`
Initial database schema setup. Contains:
- Table definitions (profiles, groups, items, etc.)
- Initial RLS policies
- Database functions
- Triggers

### `backfill-profiles.sql`
Utility script to ensure all authenticated users have corresponding profile records.

## Migrations

Located in `/migrations/`, these are applied sequentially:
- `03_indexes_and_constraints.sql` - Database indexes and foreign keys
- `06_trigger_add_owner.sql` - Automatic owner assignment triggers
- `07_policies_group_members.sql` - Group membership RLS policies
- `08_storage_policies_images.sql` - Image storage access policies
- `10_get_user_email_function.sql` - Helper function for retrieving user emails

## Edge Functions

### `admin-users`
Administrative functions for user management.

### `send-group-invitation`
Handles sending invitations to join groups.

## Documentation

- `DEPLOY_EDGE_FUNCTION.md` - Deployment guide for edge functions
- `storage-buckets.md` - Storage bucket setup and configuration
- `archive-debug-scripts/README.md` - Historical debugging scripts reference

## Archive

The `/archive-debug-scripts/` directory contains historical debugging and fix scripts. See:
- Local: `archive-debug-scripts/README.md`
- MCP Reference: `/web/src/mcp/SUPABASE_ARCHIVE.md`

## Development

### Local Setup
```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Deploy functions
supabase functions deploy <function-name>
```

### Creating Migrations
```bash
# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase migration up
```

## Important Notes

⚠️ **Production Safety:**
- Always test migrations locally first
- Review RLS policies carefully
- Never run archived scripts without review
- Backup production data before major changes

## Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

