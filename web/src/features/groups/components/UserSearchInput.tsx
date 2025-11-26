import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Input from '@/components/ui/Input'

type UserSearchResult = {
  id: string
  display_name: string | null
  user_id: string
}

type UserSearchInputProps = {
  groupId: string
  onSelectUser: (userId: string, displayName: string | null) => void
  excludedUserIds?: string[]
  excludedEmails?: string[]
}

export default function UserSearchInput({
  groupId,
  onSelectUser,
  excludedUserIds = [],
  excludedEmails = [],
}: UserSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Don't search if query is too short
    if (query.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    // Debounce search
    setIsSearching(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Search profiles by display_name only
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .ilike('display_name', `%${query}%`)
          .limit(10)

        if (profilesError) throw profilesError

        // Get user_ids from auth.users for these profiles to get emails
        // We need to fetch emails separately since they're in auth.users
        const profileIds = (profiles ?? []).map(p => p.id)
        
        if (profileIds.length === 0) {
          setResults([])
          setShowDropdown(false)
          setIsSearching(false)
          return
        }

        // Fetch user emails from auth (via a server-side approach would be better)
        // For now, we'll use the user_id as a placeholder and fetch email when needed
        const results = (profiles ?? []).map(profile => ({
          id: profile.id,
          display_name: profile.display_name,
          user_id: profile.id
        }))

        // Filter out excluded users
        const filtered = results.filter(
          (user) => !excludedUserIds.includes(user.id)
        )

        setResults(filtered)
        setShowDropdown(filtered.length > 0)
      } catch (error) {
        console.error('Error searching users:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, excludedUserIds, excludedEmails])

  const handleSelect = (user: UserSearchResult) => {
    onSelectUser(user.id, user.display_name)
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <Input
        label="Search for users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by display name..."
        onBlur={() => {
          // Delay hiding dropdown to allow click events
          setTimeout(() => setShowDropdown(false), 200)
        }}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true)
        }}
      />

      {isSearching && query.length >= 2 && (
        <div className="absolute right-3 top-10 text-ink-600 text-sm">
          Searching...
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-base-800 border border-base-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full px-4 py-3 text-left hover:bg-base-700 transition-colors border-b border-base-700 last:border-b-0"
            >
              <div className="text-ink-400 font-medium">
                {user.display_name || 'No name'}
              </div>
              <div className="text-ink-600 text-sm">User ID: {user.id.slice(0, 8)}...</div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && results.length === 0 && query.length >= 2 && !isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-base-800 border border-base-700 rounded-xl shadow-lg px-4 py-3">
          <div className="text-ink-600 text-sm">No users found</div>
        </div>
      )}
    </div>
  )
}

