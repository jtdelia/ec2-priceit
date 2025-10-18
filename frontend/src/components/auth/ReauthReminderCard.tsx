import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface ReauthReminderCardProps {
  className?: string
}

export function ReauthReminderCard({ className }: ReauthReminderCardProps): JSX.Element {
  const { status, tokens, refreshTokens, setAuthError } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isAuthenticated = status === "authenticated" && tokens !== null

  const handleConfirmRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshTokens(async () => {
        // TODO: Replace with backend token refresh call
        await new Promise((resolve) => setTimeout(resolve, 800))
        return {
          accessToken: "placeholder-refreshed-token",
          expiresAt: Date.now() + 3600 * 1000,
        }
      })
      setDialogOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to refresh session. Please reconnect."
      setAuthError(message)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Session management</h3>
          <p className="text-sm text-muted-foreground">
            Refresh your Google OAuth session to keep export access active.
          </p>
        </div>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!isAuthenticated}>
              Refresh session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Refresh Google OAuth session</AlertDialogTitle>
              <AlertDialogDescription>
                We will renew your credentials with Google. This keeps your export permissions active
                without needing to disconnect and reconnect.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRefreshing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRefresh} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Refresh now"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mt-6 grid gap-2 rounded-md border bg-muted/40 p-4 text-sm">
        <div>
          <span className="font-medium">Current status</span>
          <p className="text-muted-foreground">
            {isAuthenticated ? "Session active" : "Connect a Google account to enable refresh"}
          </p>
        </div>
        {isAuthenticated && tokens && (
          <div>
            <span className="font-medium">Token expiry</span>
            <p className="text-muted-foreground">
              {new Date(tokens.expiresAt).toLocaleString(undefined, {
                hour12: false,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}