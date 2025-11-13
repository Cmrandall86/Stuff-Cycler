import { supabase } from '@/lib/supabaseClient'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'

export default function Navbar() {
  const { user } = useAuth()
  const { data: role, isLoading, error } = useRole()
  const isAdmin = role === 'admin' // role only loads when user exists, so no need for !!user check

  // Debug logging (remove after fixing)
  console.log('Navbar role debug', { user: !!user, role, isLoading, error, isAdmin })

  return (
    <div className="sticky top-0 z-10 border-b border-base-700 bg-base-800/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
        <Link to="/" className="font-semibold text-mint-400">Stuff Cycler</Link>
        <div className="flex items-center gap-3">
          {user && <Link to="/groups" className="text-ink-600 hover:text-ink-400">Groups</Link>}
          {isAdmin && <Link to="/admin/users" className="text-ink-600 hover:text-ink-400">Admin</Link>}
          {user ? (
            <>
              <Link to="/new" className="btn btn-accent px-3 py-1.5">New Item</Link>
              <button
                className="px-3 py-1.5 rounded-2xl border border-base-600 hover:bg-base-700 text-ink-400"
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn btn-accent px-3 py-1.5">Sign in</Link>
              <Link to="/signup" className="px-3 py-1.5 rounded-2xl border border-base-600 hover:bg-base-700 text-ink-400">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
