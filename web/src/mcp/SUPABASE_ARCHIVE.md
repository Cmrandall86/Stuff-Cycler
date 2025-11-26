# Supabase Archive Reference

## Location
`/supabase/archive-debug-scripts/`

## Description
Historical debugging and fix scripts from development work on the Stuff Cycler database.

## MCP Functions for Archive Access

### searchArchive(query: string)
Search through archived scripts by keyword (e.g., "recursion", "policies", "groups", "profiles").

**Use cases:**
- Finding how a specific issue was fixed
- Understanding the history of policy changes
- Reviewing past approaches to problems

### getScriptByCategory(category: string)
Retrieve scripts by category:
- `policy-fixes` - RLS and security policy repairs
- `recursion-fixes` - Database recursion issues
- `profile-management` - User profile fixes
- `items-images` - Item and image storage fixes
- `diagnostics` - Diagnostic and testing scripts
- `invitations` - Invitation system fixes

### getScriptContent(filename: string)
Retrieve the full content of a specific archived script.

**Example usage:**
```typescript
// Get all recursion fix scripts
const scripts = await getScriptByCategory('recursion-fixes');

// Get specific script content
const content = await getScriptContent('FIX-ALL-RECURSION.sql');
```

## Quick Reference

### Common Issues & Solutions

#### RLS Policy Recursion
- **Scripts:** `FIX-ALL-RECURSION.sql`, `FIX-GROUPS-RECURSION.sql`, `FIX-PROFILES-RECURSION.sql`
- **Context:** Fixed infinite loops in RLS policies that checked group membership

#### Group Policies
- **Scripts:** `FIX-GROUPS-POLICIES-COMPLETE.sql`, `FIX-GROUPS-POLICIES-FINAL.sql`
- **Context:** Refined access control for group operations

#### Item Images Migration
- **Scripts:** `migration-item-images-safe.sql`, `migration-rename-item-photos-to-images.sql`
- **Context:** Renamed and restructured item image storage

#### Profile Issues
- **Scripts:** `NUCLEAR-FIX-PROFILES.sql`, `CHECK-PROFILES-POLICIES.sql`
- **Context:** Resolved profile creation and access issues

## Integration with Current System

The issues addressed by these scripts have been properly resolved through:
1. **Migrations** in `/supabase/migrations/` - Production-ready schema changes
2. **Bootstrap** in `/supabase/bootstrap.sql` - Initial database setup
3. **Functions** in `/supabase/functions/` - Edge functions for backend logic

## Warning
⚠️ **DO NOT** run archived scripts against production without review. They represent point-in-time fixes and may conflict with current schema.

## When to Reference Archive

- Investigating similar issues
- Understanding why certain design decisions were made
- Documenting the evolution of the database schema
- Learning from past debugging approaches

