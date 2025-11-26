import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useAddMember, useGroupMembers } from '../api'
import UserSearchInput from './UserSearchInput'

export default function AddMemberModal({
  groupId,
  isOpen,
  onClose,
}: {
  groupId: string
  isOpen: boolean
  onClose: () => void
}) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const addMember = useAddMember(groupId)
  const { data: members } = useGroupMembers(groupId)

  // Build exclude list for search (users already in group)
  const excludedUserIds = members?.map(m => m.user_id) ?? []

  const handleSelectUser = async (userId: string, displayName: string | null) => {
    setError('')
    setSuccess('')
    try {
      await addMember.mutateAsync(userId)
      setSuccess(`${displayName || 'User'} added to group successfully!`)
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to add member')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member">
      <div className="space-y-6">
        {/* User Search Section */}
        <div>
          <p className="text-ink-600 text-sm mb-4">
            Search for users by display name to add them to your group.
          </p>
          <UserSearchInput
            groupId={groupId}
            onSelectUser={handleSelectUser}
            excludedUserIds={excludedUserIds}
            excludedEmails={[]}
          />
        </div>

        {/* Status messages */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-500 text-sm">{success}</div>}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

