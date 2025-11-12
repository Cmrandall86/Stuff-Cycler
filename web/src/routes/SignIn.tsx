import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Provide more helpful error messages
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.')
        } else if (signInError.message.includes('Invalid login')) {
          setError('Invalid email or password. If you just signed up, please confirm your email first.')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.session) {
        navigate({ to: '/' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'discord') => {
    setError(null)
    setOauthLoading(provider)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`)
      setOauthLoading(null)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setError(null)
      alert('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card p-6 space-y-4">
        <h1 className="text-2xl font-bold text-ink-400">Sign in</h1>
        
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Your password"
          />
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-mint-400 hover:text-mint-300"
            >
              Forgot password?
            </button>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          <Button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-base-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-base-800 text-ink-600">Or continue with</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOAuthSignIn('google')}
            disabled={!!oauthLoading}
            className="w-full"
          >
            {oauthLoading === 'google' ? 'Loading...' : 'Continue with Google'}
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOAuthSignIn('discord')}
            disabled={!!oauthLoading}
            className="w-full"
          >
            {oauthLoading === 'discord' ? 'Loading...' : 'Continue with Discord'}
          </Button>
        </div>
        
        <div className="text-center text-sm text-ink-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-mint-400 hover:text-mint-300">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
