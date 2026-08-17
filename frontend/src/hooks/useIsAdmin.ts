import useAuth from "@/hooks/useAuth"
import { ROLES } from "@/consts"

export function useIsAdmin(): boolean {
  const { auth } = useAuth()
  return auth?.role === ROLES.admin
}

export function roleLabel(role: number): string {
  if (role === ROLES.admin) return "Admin"
  if (role === ROLES.editor) return "Editor"
  return "Usuario"
}
