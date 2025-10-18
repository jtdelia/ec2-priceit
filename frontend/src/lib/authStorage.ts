import type { AuthState, AuthUser, OAuthTokens } from "@/types/auth"

const STORAGE_KEY = "aws-ec2-cost-optimizer-auth-state"

interface PersistedAuthState {
  user: AuthUser
  tokens: OAuthTokens
}

/**
 * Encode an object into a Base64 string to avoid storing raw JSON.
 */
function encode<T>(value: T): string {
  return window.btoa(JSON.stringify(value))
}

/**
 * Decode a Base64 string into an object.
 */
function decode<T>(value: string): T | null {
  try {
    return JSON.parse(window.atob(value)) as T
  } catch {
    return null
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const storage = window.sessionStorage
    const testKey = "__auth_storage_test__"
    storage.setItem(testKey, "test")
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

export function persistAuthState(user: AuthUser, tokens: OAuthTokens): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  const payload: PersistedAuthState = { user, tokens }
  storage.setItem(STORAGE_KEY, encode(payload))
}

export function loadAuthState(): PersistedAuthState | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  return decode<PersistedAuthState>(raw)
}

export function clearAuthState(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  storage.removeItem(STORAGE_KEY)
}

export function isTokenExpired(tokens: OAuthTokens, offsetMs = 0): boolean {
  return Date.now() + offsetMs >= tokens.expiresAt
}

export function deriveInitialAuthState(): AuthState {
  const persisted = loadAuthState()
  if (!persisted) {
    return {
      status: "unauthenticated",
      user: null,
      tokens: null,
      lastError: null,
    }
  }

  if (isTokenExpired(persisted.tokens)) {
    clearAuthState()
    return {
      status: "unauthenticated",
      user: null,
      tokens: null,
      lastError: null,
    }
  }

  return {
    status: "authenticated",
    user: persisted.user,
    tokens: persisted.tokens,
    lastError: null,
  }
}