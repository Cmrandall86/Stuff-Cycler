export type Group = {
  id: string
  owner_id: string
  name: string
  description: string | null
  is_invite_only: boolean
  created_at: string
}

export type GroupMember = {
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  display_name?: string | null
  avatar_url?: string | null
}

export type CreateGroupInput = {
  name: string
  description?: string
  is_invite_only?: boolean
}

export type UpdateGroupInput = {
  name?: string
  description?: string | null
  is_invite_only?: boolean
}

