import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setLoading(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-16 card p-6">
        <h1 className="text-xl font-semibold mb-2">Check your email</h1>
        <p className="text-ink-600">We sent a sign-in link to <span className="font-medium">{email}</span>.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto mt-16 card p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <input
        className="w-full px-3 py-2 rounded-2xl bg-base-700 border border-base-600 outline-none focus:ring-2 focus:ring-mint-400"
        type="email" required placeholder="you@example.com"
        value={email} onChange={(e) => setEmail(e.target.value)}
      />
      {err && <div className="text-red-400 text-sm">{err}</div>}
      <button
        className="btn btn-accent px-4 py-2 font-medium"
        disabled={loading}
      >
        {loading ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  )
}
