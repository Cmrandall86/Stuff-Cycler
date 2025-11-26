export type ItemFormData = {
  title: string
  description: string
  condition: string
  category: string
  approx_location: string
  visibility: 'public' | 'groups'
  group_ids: string[]
}

export type ItemVisibilityGroup = {
  item_id: string
  group_id: string
  tier: number
}

