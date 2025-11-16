import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useGroup, useUpdateGroup } from '../api'

export default function GroupEditModal({
  groupId,
  isOpen,
  onClose,
}: { groupId: string; isOpen: boolean; onClose: () => void }) {
  const { data: group } = useGroup(groupId)
  const update = useUpdateGroup(groupId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteOnly, setInviteOnly] = useState(true)

  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description ?? '')
      setInviteOnly(group.is_invite_only)
    }
  }, [group])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await update.mutateAsync({ name, description, is_invite_only: inviteOnly })
      onClose()
    } catch (err) {
      console.error('Failed to update group:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Group">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={inviteOnly} onChange={(e) => setInviteOnly(e.target.checked)} />
          <span className="text-ink-400">Invite only</span>
        </label>
        
        {update.isError && (
          <p className="text-red-500 text-sm">
            {(update.error as Error).message}
          </p>
        )}
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button className="btn-accent" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

