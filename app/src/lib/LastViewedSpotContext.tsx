import { createContext, useContext, useState, type ReactNode } from 'react'

type LastViewedSpotContextValue = {
  lastViewedSpotId: string | null
  setLastViewedSpotId: (id: string) => void
}

const LastViewedSpotContext = createContext<LastViewedSpotContextValue | undefined>(undefined)

export function LastViewedSpotProvider({ children }: { children: ReactNode }) {
  const [lastViewedSpotId, setLastViewedSpotId] = useState<string | null>(null)
  return (
    <LastViewedSpotContext.Provider value={{ lastViewedSpotId, setLastViewedSpotId }}>
      {children}
    </LastViewedSpotContext.Provider>
  )
}

export function useLastViewedSpot(): LastViewedSpotContextValue {
  const value = useContext(LastViewedSpotContext)
  if (!value) {
    throw new Error('useLastViewedSpot は LastViewedSpotProvider の内側でのみ使用できる')
  }
  return value
}
