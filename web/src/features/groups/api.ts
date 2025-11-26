import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Group, GroupMember, CreateGroupInput, UpdateGroupInput } from './types'

export const qk = {
  all: ['groups'] as const,
  mine: () => [...qk.all, 'mine'] as const,
  one: (id: string) => [...qk.all, id] as const,
  members: (id: string) => [...qk.all, id, 'members'] as const,
}

// --- queries ---

export function useMyGroups() {
  return useQuery({
    queryKey: qk.mine(),
    queryFn: async (): Promise<Group[]> => {
      const { data: { user }, error: ue } = await supabase.auth.getUser()
      if (ue || !user) throw new Error('Not authenticated')

      // Fetch groups I own
      const { data: ownedGroups, error: ownedError } = await supabase
        .from('groups')
        .select('id, owner_id, name, description, is_invite_only, created_at')
        .eq('owner_id', user.id)

      if (ownedError) {
        console.error('Error fetching owned groups:', ownedError)
        throw ownedError
      }

      // Fetch my group memberships
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (memberError) {
        console.error('Error fetching group memberships:', memberError)
        throw memberError
      }

      // Fetch groups I'm a member of (if any)
      let memberGroups: Group[] = []
      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map(m => m.group_id)
        const { data, error: groupsError } = await supabase
          .from('groups')
          .select('id, owner_id, name, description, is_invite_only, created_at')
          .in('id', groupIds)

        if (groupsError) {
          console.error('Error fetching member groups:', groupsError)
          throw groupsError
        }
        memberGroups = (data ?? []) as Group[]
      }

      // Merge and deduplicate by id
      const allGroups = [...(ownedGroups ?? []), ...memberGroups]
      const uniqueGroups = Array.from(
        new Map(allGroups.map(g => [g.id, g])).values()
      )

      // Sort by created_at descending
      uniqueGroups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return uniqueGroups as Group[]
    },
  })
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: qk.one(groupId),
    enabled: !!groupId,
    queryFn: async (): Promise<Group> => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, owner_id, name, description, is_invite_only, created_at')
        .eq('id', groupId)
        .single()
      if (error) {
        console.error('Error fetching group:', error)
        throw error
      }
      return data as Group
    },
  })
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: qk.members(groupId),
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      // Fetch group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('group_id, user_id, role, joined_at')
        .eq('group_id', groupId)
      
      if (membersError) {
        console.error('Error fetching group members:', membersError)
        throw membersError
      }

      if (!members || members.length === 0) {
        return []
      }

      // Fetch profiles for all user_ids
      const userIds = members.map(m => m.user_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Don't throw - just continue without profile data
      }

      // Create a map of user_id -> profile
      const profileMap = new Map(
        (profiles ?? []).map(p => [p.id, p])
      )

      // Join members with profiles
      return members.map(m => ({
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        display_name: profileMap.get(m.user_id)?.display_name ?? null,
        avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
      })) as GroupMember[]
    },
  })
}

// --- mutations ---

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<Group> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        owner_id: user.id,
        name: input.name,
        description: input.description ?? null,
        is_invite_only: input.is_invite_only ?? true,
      }

      const { data, error } = await supabase
        .from('groups')
        .insert(payload)
        .select('id, owner_id, name, description, is_invite_only, created_at')
        .single()
      
      if (error) {
        console.error('Error creating group:', error)
        throw error
      }

      // Fallback: if trigger didn't add owner to group_members, add it
      await supabase
        .from('group_members')
        .upsert({ group_id: data.id, user_id: user.id, role: 'owner' })

      return data as Group
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.mine() })
    },
  })
}

export function useUpdateGroup(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateGroupInput) => {
      const { data, error } = await supabase
        .from('groups')
        .update(input)
        .eq('id', groupId)
        .select('*')
        .single()
      
      if (error) {
        console.error('Error updating group:', error)
        throw error
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.one(groupId) })
      qc.invalidateQueries({ queryKey: qk.mine() })
    },
  })
}

export function useLeaveGroup(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // If user is owner, disallow leaving
      const { data: g } = await supabase.from('groups').select('owner_id').eq('id', groupId).single()
      if (g?.owner_id === user.id) {
        throw new Error('Owners cannot leave their own group. (Transfer ownership or delete the group.)')
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error leaving group:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.mine() })
      qc.invalidateQueries({ queryKey: qk.members(groupId) })
    },
  })
}

export function useDeleteGroup(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Only owner can delete
      const { data: g } = await supabase.from('groups').select('owner_id').eq('id', groupId).single()
      if (g?.owner_id !== user.id) {
        throw new Error('Only the group owner can delete the group')
      }

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
      
      if (error) {
        console.error('Error deleting group:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.mine() })
      qc.invalidateQueries({ queryKey: qk.all })
    },
  })
}

export function useAddMember(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        })
      
      if (error) {
        console.error('Error adding member:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.members(groupId) })
    },
  })
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      // Check if trying to remove the last owner
      const { data: members } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
      
      const ownerCount = members?.filter(m => m.role === 'owner').length ?? 0
      const targetMember = members?.find(m => m.role === 'owner')
      
      if (ownerCount === 1 && targetMember) {
        throw new Error('Cannot remove the last owner of the group')
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error removing member:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.members(groupId) })
    },
  })
}

// --- role management ---

export function useUpdateMemberRole(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'owner' | 'admin' | 'member' }) => {
      // Client-side validation: ensure we don't demote the last owner
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', groupId)
      
      const ownerCount = members?.filter(m => m.role === 'owner').length ?? 0
      const targetMember = members?.find(m => m.user_id === userId)
      
      if (targetMember?.role === 'owner' && ownerCount === 1 && role !== 'owner') {
        throw new Error('Cannot demote the last owner of the group')
      }

      // If promoting to owner, ensure there's only one owner
      if (role === 'owner' && ownerCount >= 1) {
        throw new Error('A group can only have one owner. Demote the current owner first.')
      }

      const { error } = await supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error updating member role:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.members(groupId) })
    },
  })
}
