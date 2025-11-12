import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/signin" />

  return <>{children}</>
}

