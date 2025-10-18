import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { Dashboard } from "@/pages/Dashboard"
import BulkUpload from "@/pages/BulkUpload"
import AdHocPricing from "@/pages/AdHocPricing"
import { PricingExplorer } from "@/pages/PricingExplorer"
import { Activity } from "@/pages/Activity"
import { Settings } from "@/pages/Settings"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="bulk-upload" element={<BulkUpload />} />
          <Route path="adhoc" element={<AdHocPricing />} />
          <Route path="explorer" element={<PricingExplorer />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App