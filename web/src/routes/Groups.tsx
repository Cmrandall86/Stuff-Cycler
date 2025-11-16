import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useMyGroups } from '@/features/groups/api'
import GroupCreateModal from '@/features/groups/components/GroupCreateModal'
import GroupEditModal from '@/features/groups/components/GroupEditModal'
import GroupMembersPanel from '@/features/groups/components/GroupMembersPanel'
import { supabase } from '@/lib/supabaseClient'

export default function Groups() {
  const { data: groups, isLoading } = useMyGroups()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Resolve current user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-ink-400">My Groups</h1>
        <Button className="btn-accent" onClick={() => setCreateOpen(true)}>Create Group</Button>
      </div>

      {isLoading && <div className="text-ink-600">Loading groups…</div>}

      <div className="grid gap-4">
        {groups?.map(g => {
          const isOwner = currentUserId && g.owner_id === currentUserId
          return (
            <Card key={g.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-ink-400 font-medium">{g.name}</div>
                    {g.is_invite_only && (
                      <Badge variant="secondary">Invite only</Badge>
                    )}
                  </div>
                  <div className="text-ink-600 text-sm">{g.description || '—'}</div>
                </div>
                {isOwner && (
                  <Button variant="secondary" onClick={() => setEditId(g.id)}>
                    Edit
                  </Button>
                )}
              </div>

              <GroupMembersPanel groupId={g.id} />
            </Card>
          )
        })}
        {!groups?.length && !isLoading && <div className="text-ink-600">You don't belong to any groups yet.</div>}
      </div>

      <GroupCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {editId && (
        <GroupEditModal groupId={editId} isOpen={!!editId} onClose={() => setEditId(null)} />
      )}
    </div>
  )
}
