import { useContext } from "react"
import { HouseholdContext } from "@/context/HouseholdProvider"

const useHousehold = () => {
  const context = useContext(HouseholdContext)
  if (!context) {
    throw new Error("useHousehold debe usarse dentro de HouseholdProvider")
  }
  return context
}

export default useHousehold
