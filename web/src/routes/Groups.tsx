import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useMyGroups, useGroupMembers, useDeleteGroup } from '@/features/groups/api'
import GroupCreateModal from '@/features/groups/components/GroupCreateModal'
import GroupEditModal from '@/features/groups/components/GroupEditModal'
import GroupMembersPanel from '@/features/groups/components/GroupMembersPanel'
import AddMemberModal from '@/features/groups/components/AddMemberModal'
import { supabase } from '@/lib/supabaseClient'

export default function Groups() {
  const { data: groups, isLoading } = useMyGroups()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null)
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
          return (
            <GroupCard 
              key={g.id} 
              group={g} 
              currentUserId={currentUserId}
              onEdit={(id) => setEditId(id)}
              onAddMember={(id) => setAddMemberGroupId(id)}
            />
          )
        })}
        {!groups?.length && !isLoading && <div className="text-ink-600">You don't belong to any groups yet.</div>}
      </div>

      <GroupCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {editId && (
        <GroupEditModal groupId={editId} isOpen={!!editId} onClose={() => setEditId(null)} />
      )}
      {addMemberGroupId && (
        <AddMemberModal 
          groupId={addMemberGroupId} 
          isOpen={!!addMemberGroupId} 
          onClose={() => setAddMemberGroupId(null)} 
        />
      )}
    </div>
  )
}

function GroupCard({ 
  group, 
  currentUserId,
  onEdit,
  onAddMember,
}: { 
  group: any
  currentUserId: string | null
  onEdit: (id: string) => void
  onAddMember: (id: string) => void
}) {
  const { data: members } = useGroupMembers(group.id)
  const myMembership = members?.find(m => m.user_id === currentUserId)
  const isOwner = myMembership?.role === 'owner'
  const deleteGroup = useDeleteGroup(group.id)

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      deleteGroup.mutate()
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-ink-400 font-medium">{group.name}</div>
            {group.is_invite_only && (
              <Badge variant="secondary">Invite only</Badge>
            )}
          </div>
          <div className="text-ink-600 text-sm">{group.description || '—'}</div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button variant="secondary" onClick={() => onAddMember(group.id)}>
                Add Member
              </Button>
              <Button variant="secondary" onClick={() => onEdit(group.id)}>
                Edit
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                disabled={deleteGroup.isPending}
              >
                {deleteGroup.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      <GroupMembersPanel groupId={group.id} />
    </Card>
  )
}
