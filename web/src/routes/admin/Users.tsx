import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface User {
  id: string
  email?: string
  role?: 'member' | 'admin'
  user_metadata?: { display_name?: string }
  created_at?: string
  banned_until?: string
  display_name?: string
}

function AdminUsersContent() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const base = import.meta.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Get current user ID for self-demotion check
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id && !currentUserId) {
      setCurrentUserId(session.user.id)
    }
    return session?.access_token ?? ''
  }

  const fetchUsers = async () => {
    const token = await getToken()
    const url = new URL(`${base}/functions/v1/admin-users`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('perPage', '20')
    if (searchQuery) url.searchParams.set('query', searchQuery)

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anon,
        'content-type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Admin users fetch error:', { status: res.status, errorData })
      if (res.status === 401) throw new Error('Unauthorized')
      if (res.status === 403) {
        const details = errorData.details || errorData.error || 'Forbidden (admin only)'
        console.error('403 Forbidden details:', details, 'User ID:', errorData.userId)
        throw new Error(`Forbidden: ${details}`)
      }
      throw new Error(errorData.error || errorData.details || `Request failed: ${res.status}`)
    }
    return res.json()
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, searchQuery],
    queryFn: fetchUsers,
  })

  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string
      password: string
      display_name: string
      role: 'member' | 'admin'
    }) => {
      const token = await getToken()
      const res = await fetch(`${base}/functions/v1/admin-users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anon,
          'content-type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreateModalOpen(false)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      display_name?: string
      role?: 'member' | 'admin'
      password?: string
    }) => {
      // Frontend check to prevent self-demotion
      if (currentUserId && id === currentUserId && updates.role && updates.role !== 'admin') {
        throw new Error('Cannot remove your own admin privileges')
      }
      
      const token = await getToken()
      const res = await fetch(`${base}/functions/v1/admin-users/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anon,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditModalOpen(false)
      setSelectedUser(null)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async ({ id, hard }: { id: string; hard: boolean }) => {
      const token = await getToken()
      const url = new URL(`${base}/functions/v1/admin-users/${id}`)
      if (hard) url.searchParams.set('hard', 'true')

      const res = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anon,
          'content-type': 'application/json',
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteModalOpen(false)
      setSelectedUser(null)
    },
  })

  const users: User[] = data?.users || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink-400">User Management</h1>
        <Button className="btn-accent" onClick={() => setCreateModalOpen(true)}>
          Create User
        </Button>
      </div>

      <Card className="p-4 mb-4">
        <Input
          label="Search"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search by email or name..."
        />
      </Card>

      {isLoading && <div className="text-ink-500">Loading users...</div>}
      {error && (
        <div className="text-red-400 mb-4">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-base-700">
                <tr>
                  <th className="px-4 py-3 text-left text-ink-400 font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-ink-400 font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-ink-400 font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-ink-400 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-ink-400 font-semibold">Created</th>
                  <th className="px-4 py-3 text-left text-ink-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ink-600">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-t border-base-700 hover:bg-base-700/50">
                      <td className="px-4 py-3 text-ink-400">{user.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-ink-500">
                        {user.display_name || user.user_metadata?.display_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'success' : 'default'}>
                          {user.role?.charAt(0).toUpperCase() + (user.role?.slice(1) || '') || 'MEMBER'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.banned_until ? 'error' : 'success'}>
                          {user.banned_until ? 'Banned' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-600 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user)
                              setEditModalOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteModalOpen(true)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-ink-600">Page {page}</span>
            <Button
              variant="secondary"
              disabled={users.length < 20}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={(data) => createUserMutation.mutate(data)}
        loading={createUserMutation.isPending}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onSubmit={(data) => updateUserMutation.mutate({ id: selectedUser.id, ...data })}
          loading={updateUserMutation.isPending}
          isCurrentUser={selectedUser.id === currentUserId}
        />
      )}

      {selectedUser && (
        <DeleteUserModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onDelete={(hard) => deleteUserMutation.mutate({ id: selectedUser.id, hard })}
          loading={deleteUserMutation.isPending}
        />
      )}
    </div>
  )
}

function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { email: string; password: string; display_name: string; role: 'member' | 'admin' }) => void
  loading: boolean
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password, display_name: displayName, role })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input label="Display Name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <div>
          <label className="block text-ink-500 mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            className="w-full px-4 py-2 bg-base-700 border border-base-600 rounded-2xl text-ink-400"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="btn-accent" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function EditUserModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  loading,
  isCurrentUser,
}: {
  isOpen: boolean
  onClose: () => void
  user: User
  onSubmit: (data: { display_name?: string; role?: 'member' | 'admin'; password?: string }) => void
  loading: boolean
  isCurrentUser: boolean
}) {
  const [displayName, setDisplayName] = useState(user.display_name || user.user_metadata?.display_name || '')
  const [role, setRole] = useState<'member' | 'admin'>(user.role || 'member')
  const [newPassword, setNewPassword] = useState('')
  const [resetPassword, setResetPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = { display_name: displayName, role }
    if (resetPassword && newPassword) data.password = newPassword
    onSubmit(data)
  }

  const isAttemptingSelfDemotion = isCurrentUser && role !== 'admin' && user.role === 'admin'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Display Name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <div>
          <label className="block text-ink-500 mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            className="w-full px-4 py-2 bg-base-700 border border-base-600 rounded-2xl text-ink-400"
            disabled={isCurrentUser && user.role === 'admin'}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          {isCurrentUser && user.role === 'admin' && (
            <p className="text-xs text-yellow-400 mt-2">
              ⚠️ You cannot remove your own admin privileges
            </p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={resetPassword} onChange={(e) => setResetPassword(e.target.checked)} className="rounded" />
            <span className="text-ink-500">Reset Password</span>
          </label>
          {resetPassword && (
            <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2" />
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            className="btn-accent" 
            disabled={loading || isAttemptingSelfDemotion}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DeleteUserModal({
  isOpen,
  onClose,
  user,
  onDelete,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  user: User
  onDelete: (hard: boolean) => void
  loading: boolean
}) {
  const [hardDelete, setHardDelete] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete User">
      <div className="space-y-4">
        <p className="text-ink-500">
          Are you sure you want to {hardDelete ? 'permanently delete' : 'disable'} <strong>{user.email}</strong>?
        </p>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hardDelete} onChange={(e) => setHardDelete(e.target.checked)} className="rounded" />
            <span className="text-ink-500">Permanently delete (cannot be undone)</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="ghost" onClick={() => onDelete(hardDelete)} disabled={loading} className="text-red-400 hover:text-red-300">
            {loading ? 'Deleting...' : hardDelete ? 'Delete Permanently' : 'Disable'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function AdminUsers() {
  return <AdminUsersContent />
}
