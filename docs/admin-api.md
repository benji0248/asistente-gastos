# Gastito Admin API

Admin-only endpoints. Caller must have `role = 1701` (admin) in JWT / profile.

Base path: **gastos-api** `/api/v1/admin` (identity-api may handle password creation — coordinate between services).

## `GET /api/v1/admin/users`

Query: `?q=` optional search (email, username)

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "maria",
      "email": "maria@example.com",
      "role": 1712,
      "plan": "free",
      "planStatus": "active",
      "isBlocked": false,
      "lastLoginAt": "2026-08-17T09:00:00.000Z",
      "createdAt": "2026-08-01T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

## `POST /api/v1/admin/users`

Create user (identity + app profile).

```json
{
  "email": "nuevo@example.com",
  "password": "min-8-chars",
  "username": "nuevo",
  "plan": "free",
  "role": 1712
}
```

## `PATCH /api/v1/admin/users/:id`

```json
{
  "username": "nuevo_nombre",
  "role": 1712,
  "plan": "pro",
  "planStatus": "active",
  "isBlocked": true
}
```

- `plan: "free"` → quitar Pro manualmente
- `plan: "pro"` + `planStatus: "active"` → dar Pro sin Stripe (admin grant)

## `POST /api/v1/admin/users/:id/password`

```json
{ "password": "nueva-clave-segura" }
```

## Login / block behavior

- On successful login: update `profiles.last_login_at = now()` (and sync `email` if needed)
- If `is_blocked = true`: auth must reject login with `403` and message `Cuenta bloqueada`

## SQL

Apply `supabase/admin-users.sql` on the app database.

Admin role constant: `1701` (see `frontend/src/consts.ts`).
