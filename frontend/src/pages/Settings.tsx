import { ConnectGoogleCard } from "@/components/auth/ConnectGoogleCard"
import { ReauthReminderCard } from "@/components/auth/ReauthReminderCard"
import { ModeToggle } from "@/components/ui/mode-toggle"

export function Settings(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Account configuration and OAuth management
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectGoogleCard />
        <ReauthReminderCard />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Theme</label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme for the application.
              </p>
            </div>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}