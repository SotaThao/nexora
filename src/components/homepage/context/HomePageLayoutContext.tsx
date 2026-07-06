import { createContext, useContext, type ReactNode } from 'react'

interface HomePageLayoutContextValue {
  hasMobileMenu: boolean
  openSidebarMenu: () => void
}

const defaultValue: HomePageLayoutContextValue = {
  hasMobileMenu: false,
  openSidebarMenu: () => {},
}

const HomePageLayoutContext = createContext<HomePageLayoutContextValue>(defaultValue)

interface HomePageLayoutProviderProps {
  value: HomePageLayoutContextValue
  children: ReactNode
}

export function HomePageLayoutProvider({ value, children }: HomePageLayoutProviderProps) {
  return (
    <HomePageLayoutContext.Provider value={value}>
      {children}
    </HomePageLayoutContext.Provider>
  )
}

export function useHomePageLayout() {
  return useContext(HomePageLayoutContext)
}
