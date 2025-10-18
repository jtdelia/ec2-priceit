import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react"
import type {
  AuthContextValue,
  AuthState,
  AuthStatus,
  AuthUser,
  OAuthTokens,
} from "@/types/auth"
import { clearAuthState, deriveInitialAuthState, persistAuthState } from "@/lib/authStorage"

type AuthAction =
  | { type: "SET_LOADING" }
  | { type: "COMPLETE_SIGN_IN"; payload: { user: AuthUser; tokens: OAuthTokens } }
  | { type: "SET_ERROR"; payload: { message: string | null } }
  | { type: "UPDATE_TOKENS"; payload: { tokens: OAuthTokens } }
  | { type: "SIGN_OUT" }

const initialState: AuthState = {
  status: "unauthenticated",
  user: null,
  tokens: null,
  lastError: null,
}

function reducer(state: AuthState, action: AuthAction): AuthState {
  console.log(`[AUTH] Action: ${action.type}`, 'payload' in action ? action.payload : {})

  switch (action.type) {
    case "SET_LOADING":
      console.log("[AUTH] Setting loading state")
      return {
        ...state,
        status: "loading",
        lastError: null,
      }
    case "COMPLETE_SIGN_IN":
      console.log("[AUTH] Sign in completed for user:", action.payload.user.email)
      return {
        status: "authenticated",
        user: action.payload.user,
        tokens: action.payload.tokens,
        lastError: null,
      }
    case "SET_ERROR":
      console.error("[AUTH] Auth error:", action.payload.message)
      return {
        ...state,
        status: "error",
        lastError: action.payload.message,
      }
    case "UPDATE_TOKENS":
      if (state.user === null) {
        console.warn("[AUTH] Attempted to update tokens but no user present")
        return state
      }
      console.log("[AUTH] Tokens updated for user:", state.user.email)
      return {
        ...state,
        status: "authenticated",
        tokens: action.payload.tokens,
      }
    case "SIGN_OUT":
      console.log("[AUTH] User signed out")
      return {
        ...initialState,
        status: "unauthenticated",
      }
    default:
      console.warn("[AUTH] Unknown action type:", (action as { type: string }).type)
      return state
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const hydratedInitialState = useMemo(() => deriveInitialAuthState(), [])
  const [state, dispatch] = useReducer(reducer, hydratedInitialState)

  const setAuthLoading = useCallback(() => {
    dispatch({ type: "SET_LOADING" })
  }, [])

  const completeSignIn = useCallback(
    (user: AuthUser, tokens: OAuthTokens) => {
      dispatch({ type: "COMPLETE_SIGN_IN", payload: { user, tokens } })
    },
    []
  )

  const setAuthError = useCallback((message: string | null) => {
    dispatch({ type: "SET_ERROR", payload: { message } })
  }, [])

  const updateTokens = useCallback((tokens: OAuthTokens) => {
    dispatch({ type: "UPDATE_TOKENS", payload: { tokens } })
  }, [])

  const signOut = useCallback(() => {
    clearAuthState()
    dispatch({ type: "SIGN_OUT" })
  }, [])

  const refreshTokens = useCallback(
    async (fetcher: () => Promise<OAuthTokens>) => {
      dispatch({ type: "SET_LOADING" })
      try {
        const nextTokens = await fetcher()
        dispatch({ type: "UPDATE_TOKENS", payload: { tokens: nextTokens } })
        return nextTokens
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to refresh authentication tokens"
        dispatch({ type: "SET_ERROR", payload: { message } })
        clearAuthState()
        dispatch({ type: "SIGN_OUT" })
        throw error
      }
    },
    []
  )

  useEffect(() => {
    if (state.status === "authenticated" && state.user && state.tokens) {
      persistAuthState(state.user, state.tokens)
    } else if (state.status === "unauthenticated") {
      clearAuthState()
    }
  }, [state])

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      setAuthLoading,
      completeSignIn,
      setAuthError,
      updateTokens,
      refreshTokens,
      signOut,
    }),
    [
      state,
      setAuthLoading,
      completeSignIn,
      setAuthError,
      updateTokens,
      refreshTokens,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function getAuthStatus(state: AuthState): AuthStatus {
  return state.status
}

export function isAuthenticated(state: AuthState): boolean {
  return state.status === "authenticated" && state.user !== null && state.tokens !== null
}