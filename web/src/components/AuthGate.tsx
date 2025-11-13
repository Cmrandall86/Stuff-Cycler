import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/signin" />

  return <>{children}</>
}

