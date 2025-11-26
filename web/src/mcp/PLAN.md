# MCP Integration Plan

**Goal:** keep user content safe & searchable; assist with tags; automate tier releases.

## Image pipeline MCP
- Functions: `stripExif(image)`, `classify(image)`, `phash(image)`
- Trigger: before upload → block unsafe; dedupe via pHash.

## Auto-tagging MCP
- Function: `suggestTags({title, description, imageThumb}) -> string[]`
- Flow: propose tags at create-item; user can accept/reject.

## Distance MCP
- Input: zip or city; Output: coarse lat/lon; Provide bucket 5/10/25 mi.

## Release scheduler MCP
- Cron: `publish_at` flips `status` or inserts into `item_visibility` tier+1.

## Moderation MCP
- Regex + ML for phone numbers, slurs, prohibited items → soft block with rationale.

## Supabase Archive MCP
- Functions: `searchArchive(query)`, `getScriptByCategory(category)`, `getScriptContent(filename)`
- Purpose: Access historical debugging and fix scripts for reference
- Location: `/supabase/archive-debug-scripts/`
- See: `SUPABASE_ARCHIVE.md` for details

