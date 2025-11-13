// src/lib/bootstrapUser.ts
import { supabase } from '@/lib/supabaseClient'

let warned = false
export async function ensureUserBootstrap(userId?: string | null) {
  if (!userId) return

  // already in any group?
  const { data: gm } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .limit(1)
  if (gm && gm.length) return

  // create group (omit owner_id; default auth.uid() sets it)
  const { data: g, error: gErr } = await supabase
    .from('groups')
    .insert({ name: 'My Circle', description: 'Your default group' })
    .select('id')
    .single()

  if (gErr || !g) {
    if (!warned) { console.warn('Bootstrap group failed:', gErr); warned = true }
    return
  }

  // add membership (owner or self allowed by policy)
  const { error: mErr } = await supabase.from('group_members').insert({
    group_id: g.id, user_id: userId, role: 'owner',
  })
  if (mErr && !warned) { console.warn('Bootstrap membership failed:', mErr); warned = true }
}
