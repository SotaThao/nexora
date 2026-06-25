import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../../auth/useAuth'
import {
  bootHomePage,
  changeLanguage,
  getHomePageHandlers,
  getInitialHomePageLanguage,
  teardownHomePage,
} from '../homepageLogic.js'
import { loadHomePageScripts } from '../loadHomePageScripts'
import {
  navigateHomePagePlanCta,
  syncHomePageAuthHeader,
} from '../useHomePageAuth'

type HomePageHandlers = ReturnType<typeof getHomePageHandlers>

interface HomePageBridgeValue {
  hp: HomePageHandlers
  planCta: () => void
  onLogout: () => void
}

const HomePageBridgeContext = createContext<HomePageBridgeValue | null>(null)

interface HomePageBridgeProviderProps {
  children: ReactNode
}

export function HomePageBridgeProvider({ children }: HomePageBridgeProviderProps) {
  const navigate = useNavigate()
  const { logout, session, status } = useAuth()
  const authRef = useRef({ logout, session, status, navigate })
  authRef.current = { logout, session, status, navigate }

  const hp = useMemo(() => getHomePageHandlers(), [])

  useLayoutEffect(() => {
    changeLanguage(getInitialHomePageLanguage())
  }, [])

  useLayoutEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        await loadHomePageScripts()
        if (cancelled) return
        bootHomePage()
        syncHomePageAuthHeader(
          authRef.current.session,
          authRef.current.status,
          authRef.current.navigate,
        )
      } catch {
        syncHomePageAuthHeader(
          authRef.current.session,
          authRef.current.status,
          authRef.current.navigate,
        )
      }
    }

    void boot()
    return () => {
      cancelled = true
      teardownHomePage()
    }
  }, [])

  useLayoutEffect(() => {
    syncHomePageAuthHeader(session, status, navigate)
  }, [session, status, navigate])

  const value = useMemo<HomePageBridgeValue>(
    () => ({
      hp,
      planCta: () => {
        navigateHomePagePlanCta(session, status, navigate)
      },
      onLogout: () => {
        hp.handleLogout()
        const { logout: doLogout, navigate: nav } = authRef.current
        void doLogout().then(() => {
          syncHomePageAuthHeader(null, 'anonymous', nav)
        })
      },
    }),
    [hp, session, status, navigate],
  )

  return (
    <HomePageBridgeContext.Provider value={value}>{children}</HomePageBridgeContext.Provider>
  )
}

export function useHomePageBridge() {
  const ctx = useContext(HomePageBridgeContext)
  if (!ctx) {
    throw new Error('useHomePageBridge must be used within HomePageBridgeProvider')
  }
  return ctx
}
