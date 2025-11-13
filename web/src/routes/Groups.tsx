import { useGroups } from '@/hooks/useGroups'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function Groups() {
  const { data: groups, isLoading, error } = useGroups()

  if (isLoading) {
    return <div className="text-ink-500">Loading groups...</div>
  }

  if (error) {
    return <div className="text-red-500">Error loading groups: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink-400">Groups</h1>
        <Button className="btn-accent">Create Group</Button>
      </div>
      {!groups || groups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ink-600 mb-4">No groups yet.</p>
          <Button className="btn-accent">Create your first group</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="p-4">
              <h2 className="text-xl font-semibold text-ink-400 mb-2">{group.name}</h2>
              {group.description && (
                <p className="text-ink-600 mb-2">{group.description}</p>
              )}
              <div className="text-sm text-ink-600">
                {group.is_invite_only ? 'Invite only' : 'Open'}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

