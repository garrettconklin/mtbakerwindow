import { useContext } from 'react'
import { AppContext, AppContextValue } from './AppContext.js'

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

