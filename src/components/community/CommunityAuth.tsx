import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mapSupabaseError, type SupabaseDisplayError } from '../../lib/supabaseError'
import { supabaseClient } from '../../lib/supabaseClient'

type DemoPersona = {
  id: 'jessica' | 'kayla' | 'linh'
  label: string
  email: string
  password: string
}

type CommunityAuthValue = {
  user: User | null
  session: Session | null
  isAnonymous: boolean
  isLoading: boolean
  authReady: boolean
  error: SupabaseDisplayError | null
  signInAs: (persona: DemoPersona) => Promise<void>
  signOutToAnonymous: () => Promise<void>
}

const CommunityAuthContext = createContext<CommunityAuthValue | null>(null)

const defaultPassword = import.meta.env.VITE_COMMUNITY_DEMO_PASSWORD || 'demo1234'

export const COMMUNITY_DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'jessica',
    label: 'Jessica · thợ',
    email: import.meta.env.VITE_COMMUNITY_DEMO_JESSICA_EMAIL || 'jessica@demo.nexora',
    password: import.meta.env.VITE_COMMUNITY_DEMO_JESSICA_PASSWORD || defaultPassword,
  },
  {
    id: 'kayla',
    label: 'Kayla · chủ',
    email: import.meta.env.VITE_COMMUNITY_DEMO_KAYLA_EMAIL || 'kayla@demo.nexora',
    password: import.meta.env.VITE_COMMUNITY_DEMO_KAYLA_PASSWORD || defaultPassword,
  },
  {
    id: 'linh',
    label: 'Linh · khách',
    email: import.meta.env.VITE_COMMUNITY_DEMO_LINH_EMAIL || 'linh@demo.nexora',
    password: import.meta.env.VITE_COMMUNITY_DEMO_LINH_PASSWORD || defaultPassword,
  },
]

async function anonymousSession(): Promise<Session | null> {
  const { data, error } = await supabaseClient.auth.signInAnonymously()
  if (error) throw mapSupabaseError(error)
  return data.session
}

export function CommunityAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<SupabaseDisplayError | null>(null)

  useEffect(() => {
    let active = true
    const restoreSession = async () => {
      const { data, error: sessionError } = await supabaseClient.auth.getSession()
      if (sessionError) {
        if (active) setError(mapSupabaseError(sessionError))
      } else if (data.session) {
        if (active) {
          setSession(data.session)
          setUser(data.session.user)
        }
      } else {
        try {
          const anonymous = await anonymousSession()
          if (active) {
            setSession(anonymous)
            setUser(anonymous?.user ?? null)
          }
        } catch (nextError) {
          if (active) setError(mapSupabaseError(nextError))
        }
      }
      if (active) setIsLoading(false)
    }
    void restoreSession()
    const { data: listener } = supabaseClient.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      // Identity changed: drop cached community data so queries refetch under the
      // new session's JWT (RLS is user-scoped). Without this, switching persona
      // shows the previous identity's rows until a manual reload.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        queryClient.clear()
      }
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [queryClient])

  const value = useMemo<CommunityAuthValue>(() => ({
    user,
    session,
    isAnonymous: user?.is_anonymous === true,
    isLoading,
    authReady: !isLoading && Boolean(session),
    error,
    async signInAs(persona) {
      setError(null)
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: persona.email,
        password: persona.password,
      })
      if (signInError) {
        setError(mapSupabaseError(signInError))
        return
      }
      setSession(data.session)
      setUser(data.user)
    },
    async signOutToAnonymous() {
      setError(null)
      const { error: signOutError } = await supabaseClient.auth.signOut()
      if (signOutError) {
        setError(mapSupabaseError(signOutError))
        return
      }
      try {
        const anonymous = await anonymousSession()
        setSession(anonymous)
        setUser(anonymous?.user ?? null)
      } catch (nextError) {
        setError(mapSupabaseError(nextError))
      }
    },
  }), [error, isLoading, session, user])

  return <CommunityAuthContext.Provider value={value}>{children}</CommunityAuthContext.Provider>
}

export function useCommunityAuth(): CommunityAuthValue {
  const context = useContext(CommunityAuthContext)
  if (!context) throw new Error('useCommunityAuth must be used inside CommunityAuthProvider')
  return context
}

export function CommunityPersonaSwitcher() {
  const { error, isAnonymous, isLoading, signInAs, signOutToAnonymous, user } = useCommunityAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Show on dev, and on demo deploys where VITE_ENABLE_DEMO_TOOLS is set (the
  // deployed Community demo needs persona switching, and DemoStaffShell reserves
  // a 52px top bar for this switcher — hiding it on prod left an empty header gap).
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_TOOLS !== 'true') return null

  const selectPersona = async (persona: DemoPersona) => {
    setIsSigningIn(true)
    await signInAs(persona)
    setIsSigningIn(false)
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[130] border-b border-white/10 bg-[#101322] text-white">
      <div className="mx-auto flex min-h-[52px] max-w-6xl flex-wrap items-center justify-center gap-1.5 px-2 py-1.5 sm:justify-between sm:px-4">
        <span className="text-[10px] font-bold text-white/65">
          {isLoading ? 'Đang tạo phiên demo…' : isAnonymous ? 'Khách ẩn danh' : user?.email}
        </span>
        <div className="flex items-center gap-1">
          {COMMUNITY_DEMO_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              type="button"
              disabled={isLoading || isSigningIn}
              onClick={() => void selectPersona(persona)}
              className="min-h-11 rounded-full bg-white/10 px-2.5 text-[10px] font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {persona.label}
            </button>
          ))}
          <button
            type="button"
            disabled={isLoading || isSigningIn || isAnonymous}
            onClick={() => void signOutToAnonymous()}
            className="min-h-11 rounded-full px-2.5 text-[10px] font-extrabold text-brandCyan transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Khách
          </button>
        </div>
      </div>
      {error ? <p className="border-t border-white/10 px-3 py-1.5 text-center text-[10px] font-semibold text-red-200">{error.message}</p> : null}
    </div>
  )
}
