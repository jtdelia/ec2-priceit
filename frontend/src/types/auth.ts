/**
 * Authentication status values used by the AuthContext state machine.
 */
export type AuthStatus = "unauthenticated" | "loading" | "authenticated" | "error"

/**
 * Authenticated Google user profile metadata.
 */
export interface AuthUser {
  id: string
  email: string
  displayName?: string
  photoUrl?: string
  domain?: string
}

/**
 * OAuth token payload returned after successful authentication.
 */
export interface OAuthTokens {
  accessToken: string
  /**
   * Epoch timestamp (milliseconds) at which the access token expires.
   */
  expiresAt: number
  refreshToken?: string
  scope?: string[]
  tokenType?: string
}

/**
 * Core authentication state persisted within the AuthContext.
 */
export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  tokens: OAuthTokens | null
  lastError: string | null
}

/**
 * Public interface exposed through the AuthContext.
 */
export interface AuthContextValue extends AuthState {
  setAuthLoading: () => void
  completeSignIn: (user: AuthUser, tokens: OAuthTokens) => void
  setAuthError: (message: string | null) => void
  updateTokens: (tokens: OAuthTokens) => void
  refreshTokens: (fetcher: () => Promise<OAuthTokens>) => Promise<OAuthTokens>
  signOut: () => void
}