import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface ConnectGoogleCardProps {
  className?: string
}

export function ConnectGoogleCard({ className }: ConnectGoogleCardProps): JSX.Element {
  const { status, user, setAuthLoading, completeSignIn, setAuthError, signOut } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)

  const isConnected = status === "authenticated" && user !== null

  const handleConnect = async () => {
    setAuthLoading()
    try {
      // TODO: Replace with actual OAuth flow integration
      await new Promise((resolve) => setTimeout(resolve, 800))
      completeSignIn(
        {
          id: "placeholder-user",
          email: "user@example.com",
          displayName: "Placeholder User",
        },
        {
          accessToken: "placeholder-token",
          expiresAt: Date.now() + 3600 * 1000,
        }
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect Google account"
      setAuthError(message)
      setDialogOpen(true)
    }
  }

  const handleDisconnect = () => {
    signOut()
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
          <h3 className="text-lg font-semibold">Google OAuth Integration</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Google account to enable Google Sheets export functionality.
          </p>
        </div>
        {isConnected ? (
          <Button variant="destructive" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={handleConnect}>
            Connect
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-sm font-medium">Connection status</p>
          <p className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : status === "loading" ? "Connecting..." : "Not connected"}
          </p>
        </div>

        {isConnected && user && (
          <div className="grid gap-2 rounded-md border bg-muted/40 p-4 text-sm">
            <div>
              <span className="font-medium">Account</span>
              <p className="text-muted-foreground">{user.displayName ?? user.email}</p>
            </div>
            <div>
              <span className="font-medium">Email</span>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogTrigger asChild>
          <span />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication error</AlertDialogTitle>
            <AlertDialogDescription>
              The Google OAuth connection could not be established. Please try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDialogOpen(false)}>Dismiss</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}