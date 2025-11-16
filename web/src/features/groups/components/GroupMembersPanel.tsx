import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useGroup, useGroupMembers, useLeaveGroup, useRemoveMember } from '../api'
import { supabase } from '@/lib/supabaseClient'

export default function GroupMembersPanel({ groupId }: { groupId: string }) {
  const { data: group } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)
  const leave = useLeaveGroup(groupId)
  const remove = useRemoveMember(groupId)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setMyUserId(user?.id ?? null)
    })
  }, [])

  const amOwner = group && myUserId && group.owner_id === myUserId
  const amMember = !!members?.some(m => m.user_id === myUserId)

  const handleLeave = async () => {
    try {
      await leave.mutateAsync()
    } catch (err) {
      console.error('Failed to leave group:', err)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      await remove.mutateAsync(userId)
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg text-ink-400">Members</h3>
        {!amOwner && amMember && (
          <Button variant="secondary" onClick={handleLeave} disabled={leave.isPending}>
            {leave.isPending ? 'Leaving…' : 'Leave Group'}
          </Button>
        )}
      </div>

      {leave.isError && (
        <p className="text-red-500 text-sm mb-2">
          {(leave.error as Error).message}
        </p>
      )}

      {remove.isError && (
        <p className="text-red-500 text-sm mb-2">
          {(remove.error as Error).message}
        </p>
      )}

      <div className="space-y-2">
        {members?.map(m => (
          <div key={m.user_id} className="flex items-center justify-between border border-base-700 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              {m.display_name ? (
                <span className="text-ink-400">{m.display_name}</span>
              ) : (
                <span className="text-ink-400">{m.user_id.slice(0, 8)}…</span>
              )}
              <span className="text-ink-600 text-sm">({m.role})</span>
            </div>
            {amOwner && m.user_id !== group?.owner_id && (
              <Button variant="ghost" onClick={() => handleRemove(m.user_id)} disabled={remove.isPending}>
                Remove
              </Button>
            )}
          </div>
        ))}
        {!members?.length && <div className="text-ink-600 text-sm">No members yet.</div>}
      </div>
    </Card>
  )
}

