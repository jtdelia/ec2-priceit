import { PricingResultCard } from "@/components/pricing/PricingResultCard";
import { DashboardCharts } from "@/components/pricing/DashboardCharts";
import { FilterPanel } from "@/components/pricing/FilterPanel";
import { SkeletonCard } from "@/components/pricing/SkeletonCard";
import { ExportButton } from "@/components/pricing/ExportButton";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { results, error, setResults, loading, filters } =
    useDashboardStore();

  const handleClearResults = () => {
    setResults([]);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-destructive">
            Pricing Error
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Link
          to="/bulk-upload"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={handleClearResults}
        >
          Try again
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <aside className="lg:col-span-1">
          <FilterPanel />
        </aside>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome to the EC2 Pricing Dashboard
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get started by uploading your EC2 inventory.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <h3 className="text-lg font-semibold">No pricing data yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            It looks like you haven't priced any instances.
          </p>
          <Link
            to="/bulk-upload"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Price instances now
          </Link>
        </div>
      </div>
    );
  }

  const totalErrors = results.reduce(
    (acc, response) => acc + response.errors.length,
    0
  )

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Pricing Results
              </h2>
              <p className="mt-2 text-muted-foreground">
                {results.length} instance{results.length === 1 ? "" : "s"}{" "}
                priced, with {totalErrors} error{totalErrors === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton />
              <Link
                to="/bulk-upload"
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                onClick={handleClearResults}
              >
                Price more instances
              </Link>
            </div>
          </div>
          {results.length > 0 && (
            <div className="mb-8">
              <DashboardCharts />
            </div>
          )}
          <div className="space-y-4">
            {results.map((result, index) => (
              <PricingResultCard
                key={`${result.input_data.instance_type}-${result.input_data.region_code}-${index}`}
                result={result}
                filters={filters}
              />
            ))}
          </div>
        </div>
      </div>
      <aside className="lg:col-span-1">
        <FilterPanel />
      </aside>
    </div>
  )
}