# Gastito SaaS — Billing API contract

Frontend expects these endpoints on **gastos-api** (proxied at `/api`).
Auth: `Authorization: Bearer <access_token>` (same JWT as today).

## Price

- Plan Pro: **USD 2.50 / month** (Stripe Price ID via env on the server)

## `GET /api/v1/me`

Extend the existing payload:

```json
{
  "id": "uuid",
  "username": "benji",
  "role": 1712,
  "plan": "free",
  "planStatus": "active",
  "statsTrialEndsAt": "2026-08-27T12:00:00.000Z",
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "stripeCustomerId": null
}
```

Rules:

- New users: `plan=free`, `statsTrialEndsAt = now + 12 days`
- After Stripe payment succeeds: `plan=pro`, `planStatus=active`
- Self-hosted deployments can ignore Stripe and treat everyone as Pro (`VITE_BILLING_MODE=selfhosted` on the frontend)

## `POST /api/v1/billing/checkout`

Body:

```json
{
  "successUrl": "https://app/home?billing=success",
  "cancelUrl": "https://app/home?billing=cancel"
}
```

Response:

```json
{ "url": "https://checkout.stripe.com/..." }
```

Creates (or reuses) a Stripe Customer for the user and a Checkout Session for the Pro monthly price.

## `POST /api/v1/billing/portal`

Body:

```json
{ "returnUrl": "https://app/<userId>/profile" }
```

Response:

```json
{ "url": "https://billing.stripe.com/..." }
```

## `POST /api/v1/billing/webhook`

Raw Stripe webhook (no JWT). Handle at least:

- `checkout.session.completed` → set `plan=pro`
- `customer.subscription.updated` → sync status / period end / cancel_at_period_end
- `customer.subscription.deleted` → set `plan=free`

Use `billing_events` for idempotency (`supabase/saas-subscriptions.sql`).

## Server-side enforcement (required)

| Feature | Free | Pro |
|---|---|---|
| Expenses / accounts | yes | yes |
| Categories | max 5, no seeds | unlimited |
| Stats | only while `now < statsTrialEndsAt` | yes |
| OCR / scan | no | yes |
| Household | no | yes |
| Recurring household expenses | no | yes |
| Credit card statements | no | yes |

Return `403` with a clear message (e.g. `Pro requerido`) when Free hits a gate.

## SQL

Apply `supabase/saas-subscriptions.sql` on the app Postgres (local or remote).

## Frontend env

```env
# saas (default) | selfhosted
VITE_BILLING_MODE=saas
```
