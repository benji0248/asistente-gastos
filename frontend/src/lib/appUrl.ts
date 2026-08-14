/** Origin for app redirects and absolute links. */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }
  return import.meta.env.VITE_APP_URL ?? ''
}

export function getAuthRedirectUrl(path = '/login'): string {
  return `${getAuthRedirectOrigin()}${path}`
}
