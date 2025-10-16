import { createContext, useState, ReactNode } from 'react'
import { State, DEFAULT_STATE } from './state/State.js'

export type { State }

export interface AppContextValue {
  readonly state: State;
  readonly patchState: (patch: Partial<State>) => void;
}

export const AppContext = createContext<AppContextValue | null>(null)

export interface AppProviderProps {
  readonly children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, setState] = useState(DEFAULT_STATE)
  
  const patchState = (patch: Partial<State>) => {
    setState((prevState) => ({ ...prevState, ...patch }))
  }

  const value: AppContextValue = {
    state,
    patchState,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

