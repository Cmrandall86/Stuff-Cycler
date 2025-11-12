export interface Group {
  id: string
  owner_id: string
  name: string
  description?: string
  is_invite_only: boolean
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: string
  joined_at: string
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description?: string
  condition?: string
  category?: string
  approx_location?: string
  status: string
  publish_at?: string
  created_at: string
  updated_at: string
}

export interface ItemPhoto {
  id: string
  item_id: string
  storage_path: string
  sort_order: number
}

export interface ItemVisibility {
  item_id: string
  group_id: string
  tier: number
}

export interface Interest {
  id: string
  item_id: string
  user_id: string
  state: string
  created_at: string
}

export interface Reservation {
  id: string
  item_id: string
  claimer_id: string
  reserved_at: string
  expires_at?: string
  status: string
}

export interface Profile {
  id: string
  display_name?: string
  role: 'member' | 'admin'
  created_at: string
  updated_at: string
}

