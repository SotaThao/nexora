import { createContext, useContext, type ReactNode } from 'react'

const BookingHubVoiceEnabledContext = createContext(false)

export function BookingHubVoiceProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  return (
    <BookingHubVoiceEnabledContext.Provider value={enabled}>
      {children}
    </BookingHubVoiceEnabledContext.Provider>
  )
}

export function useBookingHubVoiceEnabled() {
  return useContext(BookingHubVoiceEnabledContext)
}
