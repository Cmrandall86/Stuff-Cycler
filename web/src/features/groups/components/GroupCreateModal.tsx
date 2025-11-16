import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useCreateGroup } from '../api'

export default function GroupCreateModal({
  isOpen,
  onClose,
}: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteOnly, setInviteOnly] = useState(true)
  const createGroup = useCreateGroup()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGroup.mutateAsync({
        name,
        description,
        is_invite_only: inviteOnly,
      })
      onClose()
      setName('')
      setDescription('')
      setInviteOnly(true)
    } catch (err) {
      console.error('Failed to create group:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={inviteOnly} onChange={(e) => setInviteOnly(e.target.checked)} />
          <span className="text-ink-400">Invite only</span>
        </label>
        
        {createGroup.isError && (
          <p className="text-red-500 text-sm">
            {(createGroup.error as Error).message}
          </p>
        )}
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button className="btn-accent" disabled={createGroup.isPending}>
            {createGroup.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

