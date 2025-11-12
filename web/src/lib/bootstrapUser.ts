import { supabase } from './supabaseClient'

export async function ensureUserBootstrap(userId: string) {
  try {
    // Small delay to ensure session is fully established
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify we have a valid session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) {
      console.warn('Session not ready for bootstrap')
      return
    }
    
    // Check if user already has at least one group membership
    const { data: gm, error: gmErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .limit(1)
    
    if (gmErr) {
      console.error('Error checking group members:', gmErr)
      // Don't throw - allow user to continue even if bootstrap fails
      return
    }

    // If user has no groups, create a default one
    if (!gm || gm.length === 0) {
      // Create group first
      const { data: g, error: gErr } = await supabase
        .from('groups')
        .insert({ 
          owner_id: userId, 
          name: 'My Circle', 
          description: 'Your default group',
          is_invite_only: true
        })
        .select('id')
        .single()
      
      if (gErr) {
        console.error('Error creating group:', gErr)
        return
      }

      // Add user as owner member
      // Note: The RLS policy allows insert if auth.uid() = user_id
      const { error: addErr } = await supabase
        .from('group_members')
        .insert({ 
          group_id: g.id, 
          user_id: userId, 
          role: 'owner' 
        })
      
      if (addErr) {
        console.error('Error adding group membership:', addErr)
        // Try to clean up the group if membership insert fails
        await supabase.from('groups').delete().eq('id', g.id)
      }
    }
  } catch (error) {
    console.error('Error in ensureUserBootstrap:', error)
    // Don't throw - allow user to continue
  }
}
