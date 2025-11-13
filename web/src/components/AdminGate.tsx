// src/components/AdminGate.tsx
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { data: role, isLoading, isFetched } = useRole()

  // Wait for auth OR role to resolve
  if (loading || isLoading || (!isFetched && user)) return null

  if (!user) return <Navigate to="/signin" />
  if (role !== 'admin') {
    console.debug('AdminGate: redirecting to / because role is not admin', { role })
    return <Navigate to="/" />
  }
  return <>{children}</>
}
