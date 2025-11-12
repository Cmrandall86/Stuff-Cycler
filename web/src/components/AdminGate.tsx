import { Navigate } from '@tanstack/react-router'
import { useRole } from '@/hooks/useRole'

interface AdminGateProps {
  children: React.ReactNode
}

export default function AdminGate({ children }: AdminGateProps) {
  const { data: role, isLoading } = useRole()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-ink-500">Loading...</div>
      </div>
    )
  }

  if (role !== 'admin') {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

