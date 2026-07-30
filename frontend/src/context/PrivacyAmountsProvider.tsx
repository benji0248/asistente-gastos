import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useLocation } from "react-router-dom"

interface PrivacyAmountsContextType {
  amountsVisible: boolean
  toggleAmountsVisible: () => void
  setAmountsVisible: (visible: boolean) => void
}

const PrivacyAmountsContext = createContext<PrivacyAmountsContextType | null>(
  null
)

export function PrivacyAmountsProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [amountsVisible, setAmountsVisible] = useState(false)

  // Al entrar a una pantalla, los totales vuelven a ocultarse.
  useEffect(() => {
    setAmountsVisible(false)
  }, [pathname])

  const toggleAmountsVisible = useCallback(() => {
    setAmountsVisible((current) => !current)
  }, [])

  const value = useMemo(
    () => ({
      amountsVisible,
      toggleAmountsVisible,
      setAmountsVisible,
    }),
    [amountsVisible, toggleAmountsVisible]
  )

  return (
    <PrivacyAmountsContext.Provider value={value}>
      {children}
    </PrivacyAmountsContext.Provider>
  )
}

export function usePrivacyAmounts() {
  const ctx = useContext(PrivacyAmountsContext)
  if (!ctx) {
    throw new Error(
      "usePrivacyAmounts debe usarse dentro de PrivacyAmountsProvider"
    )
  }
  return ctx
}
