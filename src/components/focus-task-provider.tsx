'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FocusTask { id: string; name: string; time_estimate: number }

interface FocusTaskContextType {
  focusTask: FocusTask | null
  setFocusTask: (t: FocusTask | null) => void
}

const FocusTaskContext = createContext<FocusTaskContextType>({ focusTask: null, setFocusTask: () => {} })

export const useFocusTask = () => useContext(FocusTaskContext)

export function FocusTaskProvider({ children }: { children: ReactNode }) {
  const [focusTask, setFocusTaskState] = useState<FocusTask | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flow_focus_task')
      if (saved) setFocusTaskState(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  const setFocusTask = (t: FocusTask | null) => {
    setFocusTaskState(t)
    if (t) localStorage.setItem('flow_focus_task', JSON.stringify(t))
    else localStorage.removeItem('flow_focus_task')
  }

  if (!loaded) return <>{children}</>

  return (
    <FocusTaskContext.Provider value={{ focusTask, setFocusTask }}>
      {children}
    </FocusTaskContext.Provider>
  )
}
