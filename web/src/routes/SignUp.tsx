import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || '',
          },
          emailRedirectTo: window.location.origin,
        },
      })

      if (signUpError) throw signUpError

      // If email confirmation is required, show message
      if (data.user && !data.session) {
        setError(null)
        alert('Please check your email to confirm your account before signing in.')
        navigate({ to: '/signin' })
        return
      }

      // If session exists, user is automatically logged in
      if (data.session) {
        // Update profile if display_name was provided
        if (displayName && data.user) {
          await supabase
            .from('profiles')
            .update({ display_name: displayName })
            .eq('id', data.user.id)
        }
        navigate({ to: '/' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card p-6 space-y-4">
        <h1 className="text-2xl font-bold text-ink-400">Sign up</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
          />
          
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          <Button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? 'Signing up...' : 'Sign up'}
          </Button>
        </form>
        
        <div className="text-center text-sm text-ink-600">
          Already have an account?{' '}
          <Link to="/signin" className="text-mint-400 hover:text-mint-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

