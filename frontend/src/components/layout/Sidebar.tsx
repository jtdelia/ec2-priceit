import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Upload,
  Calculator,
  Database,
  Activity,
  Settings,
} from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview and analytics",
  },
  {
    title: "Bulk Upload",
    href: "/bulk-upload",
    icon: Upload,
    description: "Upload CSV/Excel files",
  },
  {
    title: "Ad-hoc Pricing",
    href: "/adhoc",
    icon: Calculator,
    description: "Quick pricing queries",
  },
  {
    title: "Pricing Explorer",
    href: "/explorer",
    icon: Database,
    description: "Browse pricing catalog",
  },
  {
    title: "Activity",
    href: "/activity",
    icon: Activity,
    description: "Export logs and history",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account and OAuth config",
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calculator className="h-5 w-5" />
          </div>
          <span className="text-lg">EC2 Optimizer</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {!isActive && (
                    <span className="text-xs opacity-70">{item.description}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">AWS EC2 Cost Optimizer</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </div>
    </div>
  )
}