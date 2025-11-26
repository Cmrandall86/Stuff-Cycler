import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useGroup, useGroupMembers, useLeaveGroup, useRemoveMember, useUpdateMemberRole } from '../api'
import { supabase } from '@/lib/supabaseClient'
import type { Role } from '../types'

export default function GroupMembersPanel({ groupId }: { groupId: string }) {
  const { data: group } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)
  const leave = useLeaveGroup(groupId)
  const remove = useRemoveMember(groupId)
  const updateRole = useUpdateMemberRole(groupId)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setMyUserId(user?.id ?? null)
    })
  }, [])

  const myMembership = members?.find(m => m.user_id === myUserId)
  const amOwner = myMembership?.role === 'owner'
  const amMember = !!myMembership

  const handleLeave = async () => {
    try {
      await leave.mutateAsync()
    } catch (err: any) {
      console.error('Failed to leave group:', err)
      alert(err.message || 'Failed to leave group')
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      await remove.mutateAsync(userId)
    } catch (err: any) {
      console.error('Failed to remove member:', err)
      alert(err.message || 'Failed to remove member')
    }
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole })
    } catch (err: any) {
      console.error('Failed to update role:', err)
      alert(err.message || 'Failed to update role')
    }
  }

  const getRoleBadgeVariant = (role: Role) => {
    if (role === 'owner') return 'default'
    if (role === 'admin') return 'secondary'
    return 'secondary'
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

      {updateRole.isError && (
        <p className="text-red-500 text-sm mb-2">
          {(updateRole.error as Error).message}
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
              <Badge variant={getRoleBadgeVariant(m.role)}>
                {m.role}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Role management for owner */}
              {amOwner && m.user_id !== myUserId && m.role !== 'owner' && (
                <select
                  className="bg-base-900 border border-base-700 rounded-lg px-2 py-1 text-sm text-ink-400"
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.user_id, e.target.value as Role)}
                  disabled={updateRole.isPending}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {/* Allow promoting to owner only if you want to transfer ownership */}
                  {/* <option value="owner">Owner</option> */}
                </select>
              )}
              
              {/* Remove button for owner/admin (but not for the owner themselves) */}
              {amOwner && m.user_id !== myUserId && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemove(m.user_id)} 
                  disabled={remove.isPending || updateRole.isPending}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
        {!members?.length && <div className="text-ink-600 text-sm">No members yet.</div>}
      </div>
    </Card>
  )
}

