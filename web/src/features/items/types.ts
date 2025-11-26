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

export type ImageFile = {
  id: string
  file?: File
  url?: string
  isExisting: boolean
  sortOrder: number
}

export type ItemImageWithUrl = {
  id: string
  item_id: string
  path: string
  sort_order: number
  signed_url?: string
}

