# Archive: Debugging & Fix Scripts

This directory contains historical debugging, diagnostic, and fix scripts from development work.

## Purpose
These files were used during development to troubleshoot and fix various issues with:
- RLS (Row Level Security) policies
- Database recursion problems
- Group membership policies
- Profile management
- Item images and storage
- Invitation system

## Categories

### Policy Fixes
- `FIX-GROUPS-POLICIES-COMPLETE.sql`
- `FIX-GROUPS-POLICIES-FINAL.sql`
- `NUCLEAR-RESET-POLICIES.sql`
- `rls-policies.sql`
- `TEMP-DISABLE-RLS.sql`

### Recursion Fixes
- `FIX-ALL-RECURSION.sql`
- `FIX-GROUPS-RECURSION.sql`
- `FIX-PROFILES-RECURSION.sql`
- `FIX-GROUP-MEMBERS-RECURSION.sql`
- `FIX-RECURSION-SIMPLE.sql`
- `FIX-RECURSION.sql`

### Profile & User Management
- `NUCLEAR-FIX-PROFILES.sql`
- `CHECK-PROFILES-POLICIES.sql`

### Items & Images
- `fix-items-rls-public.sql`
- `simple-fix-item-images.sql`
- `migration-item-images-safe.sql`
- `migration-rename-item-photos-to-images.sql`

### Diagnostics & Testing
- `DIAGNOSE-CURRENT-STATE.sql`
- `diagnostic-check.sql`
- `check-tables.sql`
- `TEST-ITEMS-QUERY.sql`

### Invitations
- `CLEANUP-INVITATIONS.sql`

### Everything Else
- `FIX-EVERYTHING.sql`

### Documentation
- `DEBUG-INSTRUCTIONS.md`
- `HOW-TO-CHECK-LOGS.md`
- `MIGRATION-INSTRUCTIONS.md`
- `README-FIX-500-ERROR.md`

## Note
These files are kept for historical reference and should NOT be run against the production database without careful review. The issues they address have been resolved through proper migrations.

