import { apiFetch } from "@/lib/api/http"
import type {
  AdminCreateUserInput,
  AdminSetPasswordInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUsersListResponse,
} from "./types"

function normalizeUser(row: Record<string, unknown>): AdminUser {
  return {
    id: String(row.id),
    username: String(row.username ?? ""),
    email: String(row.email ?? ""),
    role: Number(row.role ?? 1712),
    plan: row.plan === "pro" ? "pro" : "free",
    planStatus:
      (row.plan_status as AdminUser["planStatus"]) ??
      (row.planStatus as AdminUser["planStatus"]) ??
      "active",
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked),
    lastLoginAt:
      (row.last_login_at as string | null) ??
      (row.lastLoginAt as string | null) ??
      null,
    createdAt:
      (row.created_at as string | null) ??
      (row.createdAt as string | null) ??
      null,
  }
}

export async function listAdminUsers(query = ""): Promise<AdminUsersListResponse> {
  const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""
  const payload = await apiFetch<Record<string, unknown>>(
    `/api/v1/admin/users${params}`
  )

  const rows = (payload.users ?? payload.items ?? []) as Record<string, unknown>[]
  return {
    users: rows.map(normalizeUser),
    total: Number(payload.total ?? rows.length),
  }
}

export async function createAdminUser(input: AdminCreateUserInput): Promise<AdminUser> {
  const created = await apiFetch<Record<string, unknown>>("/api/v1/admin/users", {
    method: "POST",
    body: input,
  })
  return normalizeUser(created.user ? (created.user as Record<string, unknown>) : created)
}

export async function updateAdminUser(
  userId: string,
  input: AdminUpdateUserInput
): Promise<AdminUser> {
  const updated = await apiFetch<Record<string, unknown>>(
    `/api/v1/admin/users/${userId}`,
    { method: "PATCH", body: input }
  )
  return normalizeUser(updated.user ? (updated.user as Record<string, unknown>) : updated)
}

export async function setAdminUserPassword(
  userId: string,
  input: AdminSetPasswordInput
): Promise<void> {
  await apiFetch(`/api/v1/admin/users/${userId}/password`, {
    method: "POST",
    body: input,
  })
}
