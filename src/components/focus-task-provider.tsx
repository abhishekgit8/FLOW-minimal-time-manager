'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface FocusTask { id: string; name: string; time_estimate: number }

interface FocusTaskContextType {
  focusTask: FocusTask | null
  setFocusTask: (t: FocusTask | null) => void
}

const FocusTaskContext = createContext<FocusTaskContextType>({ focusTask: null, setFocusTask: () => {} })

export const useFocusTask = () => useContext(FocusTaskContext)

export function FocusTaskProvider({ children }: { children: ReactNode }) {
  const [focusTask, setFocusTask] = useState<FocusTask | null>(null)
  return (
    <FocusTaskContext.Provider value={{ focusTask, setFocusTask }}>
      {children}
    </FocusTaskContext.Provider>
  )
}
