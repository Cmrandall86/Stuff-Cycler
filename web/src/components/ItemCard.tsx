import { Link } from '@tanstack/react-router'
import type { Item, ItemImage } from '../lib/types'
import Card from './ui/Card'
import Badge from './ui/Badge'

interface ItemCardProps {
  item: Item & { item_images?: ItemImage[] }
}

export default function ItemCard({ item }: ItemCardProps) {
  const firstImage = item.item_images?.[0]

  return (
    <Link to="/item/$id" params={{ id: item.id }}>
      <Card className="p-4 hover:border-mint-400 transition-colors cursor-pointer">
        {firstImage && (
          <div className="w-full h-48 bg-base-700 rounded-lg mb-4 overflow-hidden">
            <img
              src={firstImage.path}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h3 className="text-lg font-semibold text-ink-400 mb-2">{item.title}</h3>
        {item.description && (
          <p className="text-ink-600 text-sm mb-2 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant={item.status === 'active' ? 'success' : 'default'}>
            {item.status}
          </Badge>
          {item.category && (
            <span className="text-ink-600 text-sm">{item.category}</span>
          )}
        </div>
      </Card>
    </Link>
  )
}

