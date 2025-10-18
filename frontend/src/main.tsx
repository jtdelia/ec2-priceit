import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { AuthProvider } from "@/context/AuthContext"
import { ExportHistoryProvider } from "@/context/ExportHistoryContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { queryClient } from "./lib/queryClient"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="aws-ec2-pricing-theme">
        <AuthProvider>
          <ExportHistoryProvider>
            <App />
          </ExportHistoryProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)