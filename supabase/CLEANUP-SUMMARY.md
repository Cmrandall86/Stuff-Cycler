# Supabase Directory Cleanup Summary

**Date:** November 26, 2025

## What Was Done

### 1. ✅ Organized Archive
Created `/supabase/archive-debug-scripts/` directory containing **27 historical files**:
- 11 Policy & RLS fix scripts
- 6 Recursion fix scripts  
- 4 Diagnostic scripts
- 3 Migration scripts (historical)
- 3 Item/Image fix scripts
- 4 Documentation files

### 2. ✅ Clean Directory Structure
The supabase directory now contains only active files:

```
supabase/
├── archive-debug-scripts/    # 27 archived files + README
├── functions/                 # Edge functions (admin-users, send-group-invitation)
├── migrations/                # 5 active migrations
├── .temp/                     # Supabase CLI temp files (now gitignored)
├── backfill-profiles.sql     # Active utility script
├── bootstrap.sql             # Initial DB setup
├── config.toml               # Supabase config
├── DEPLOY_EDGE_FUNCTION.md   # Deployment docs
├── README.md                 # New: Directory documentation
└── storage-buckets.md        # Storage docs
```

### 3. ✅ Created Documentation
- **`README.md`** - Comprehensive supabase directory guide
- **`archive-debug-scripts/README.md`** - Categorized archive reference

### 4. ✅ MCP Integration
- **`/web/src/mcp/SUPABASE_ARCHIVE.md`** - MCP functions for accessing archive
- **Updated `/web/src/mcp/PLAN.md`** - Added Supabase Archive MCP section

### 5. ✅ Git Cleanup
- Added `.temp/` to `.gitignore`
- Removed nested `supabase/supabase/` directory
- Unstaged generated Supabase CLI files

## Files Archived (27 total)

### Debugging & Diagnostics
- `CHECK-PROFILES-POLICIES.sql`
- `check-tables.sql`
- `DEBUG-INSTRUCTIONS.md`
- `DIAGNOSE-CURRENT-STATE.sql`
- `diagnostic-check.sql`
- `HOW-TO-CHECK-LOGS.md`
- `TEST-ITEMS-QUERY.sql`

### Fix Scripts
- `CLEANUP-INVITATIONS.sql`
- `FIX-ALL-RECURSION.sql`
- `FIX-EVERYTHING.sql`
- `FIX-GROUP-MEMBERS-RECURSION.sql`
- `FIX-GROUPS-POLICIES-COMPLETE.sql`
- `FIX-GROUPS-POLICIES-FINAL.sql`
- `FIX-GROUPS-RECURSION.sql`
- `FIX-PROFILES-RECURSION.sql`
- `FIX-RECURSION-SIMPLE.sql`
- `FIX-RECURSION.sql`
- `NUCLEAR-FIX-PROFILES.sql`
- `NUCLEAR-RESET-POLICIES.sql`
- `TEMP-DISABLE-RLS.sql`
- `fix-items-rls-public.sql`
- `simple-fix-item-images.sql`

### Historical Migrations
- `migration-item-images-safe.sql`
- `migration-rename-item-photos-to-images.sql`
- `rls-policies.sql`

### Documentation
- `MIGRATION-INSTRUCTIONS.md`
- `README-FIX-500-ERROR.md`

## MCP Functions Available

```typescript
// Search archive by keyword
searchArchive("recursion")

// Get scripts by category
getScriptByCategory("policy-fixes")
getScriptByCategory("recursion-fixes")
getScriptByCategory("diagnostics")

// Get specific script content
getScriptContent("FIX-ALL-RECURSION.sql")
```

## Benefits

✨ **Cleaner workspace** - Only active files in main directory
📚 **Better organization** - Historical context preserved but organized
🔍 **Easy reference** - MCP integration for quick archive access
🛡️ **Safety** - Clear separation between active and archived scripts
📖 **Documentation** - Comprehensive README files added

## Next Steps

The directory is now ready for development. When you need to:
- **Reference old fixes** → Check `/archive-debug-scripts/`
- **Deploy functions** → See `DEPLOY_EDGE_FUNCTION.md`
- **Create migrations** → Add to `/migrations/`
- **Access via MCP** → Use functions in `SUPABASE_ARCHIVE.md`

