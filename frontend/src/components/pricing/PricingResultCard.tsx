import type { PricingResponse } from "@/types/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Papa from "papaparse"

interface PricingResultCardProps {
  result: PricingResponse
  filters?: {
    planType: string;
    term: string;
    os: string[];
  }
}

export function PricingResultCard({ result, filters }: PricingResultCardProps) {
  const { pricing_results } = result

  // Validate pricing_results to prevent crashes
  if (!pricing_results || typeof pricing_results !== 'object') {
    console.error('Invalid pricing_results:', pricing_results)
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-destructive">
          Invalid pricing data received from API.
        </div>
      </div>
    )
  }

  // Default filters if not provided (show everything)
  const defaultFilters = {
    planType: "all",
    term: "all",
    os: ["linux", "windows"],
  }
  const activeFilters = filters || defaultFilters

  const handleExportCSV = () => {
    const csvData = [{
      region_code: result.input_data.region_code,
      instance_type: result.input_data.instance_type,
      operation: result.input_data.operation,
      operating_system: result.input_data.operating_system,
      product_tenancy: result.input_data.product_tenancy,
      qty: result.input_data.qty,
      on_demand_hourly_rate: pricing_results.on_demand_hourly_rate,
      on_demand_1_year_total_cost: pricing_results.on_demand_1_year_total_cost,
      on_demand_3_year_total_cost: pricing_results.on_demand_3_year_total_cost,
      // Add other pricing fields as needed
    }];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${result.input_data.instance_type}-pricing.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log("Export to Excel not yet implemented");
  };

  const handleExportGoogleSheets = () => {
    // TODO: Implement Google Sheets export
    console.log("Export to Google Sheets not yet implemented");
  };

  // Filter by OS
  const osMatch = activeFilters.os.includes(result.input_data.operating_system.toLowerCase())

  // If OS doesn't match, don't render the card
  if (!osMatch) {
    return null
  }

  // Helper functions for filtering
  const shouldShowOnDemand = activeFilters.planType === "all" || activeFilters.planType === "on-demand"
  const shouldShowRI = activeFilters.planType === "all" || activeFilters.planType === "ri"
  const shouldShowSP = activeFilters.planType === "all" || activeFilters.planType === "sp"

  const shouldShow1Year = activeFilters.term === "all" || activeFilters.term === "1yr"
  const shouldShow3Year = activeFilters.term === "all" || activeFilters.term === "3yr"

  const calculateDiscount = (
    onDemandRate: number,
    totalCost: number,
    termYears: number,
  ): string => {
    if (onDemandRate === 0) return "N/A"
    const hours = termYears * 365 * 24
    if (hours === 0) return "N/A"

    const effectiveHourlyRate = totalCost / hours
    const discount = ((onDemandRate - effectiveHourlyRate) / onDemandRate) * 100
    return `${discount.toFixed(2)}%`
  }

  try {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{result.input_data.instance_type}</h3>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} disabled>
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportGoogleSheets} disabled>
                  Export to Google Sheets
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">
              OS: {result.input_data.operating_system} | Region:{" "}
              {result.input_data.region_code} | Tenancy:{" "}
              {result.input_data.product_tenancy} | Qty: {result.input_data.qty}
            </span>
          </div>
        </div>
        {result.errors.length > 0 ? (
          <div className="mt-2 text-sm text-destructive">
            <p className="font-medium">Errors:</p>
            <ul className="list-disc pl-5">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {shouldShowOnDemand && (
              <div>
                <h4 className="font-medium">On-Demand</h4>
                <p className="text-sm text-muted-foreground">
                  Hourly Rate: ${(pricing_results.on_demand_hourly_rate ?? 0).toFixed(5)}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shouldShow1Year && (
                      <TableRow>
                        <TableCell>1 Year</TableCell>
                        <TableCell>${(pricing_results.on_demand_1_year_total_cost ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    {shouldShow3Year && (
                      <TableRow>
                        <TableCell>3 Year</TableCell>
                        <TableCell>${(pricing_results.on_demand_3_year_total_cost ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {shouldShowSP && (
              <div>
                <h4 className="font-medium">Compute Savings Plan</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Upfront</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shouldShow1Year && (
                      <>
                        <TableRow>
                          <TableCell rowSpan={3}>1 Year</TableCell>
                          <TableCell>No Upfront</TableCell>
                          <TableCell>${(pricing_results.compute_savings_plan_1_year_no_upfront_hourly_rate ?? 0).toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.compute_savings_plan_1_year_no_upfront_total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_1_year_no_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Partial Upfront</TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_1_year_partial_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>All Upfront</TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_1_year_all_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.compute_savings_plan_1_year_all_upfront_total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_1_year_all_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    )}
                    {shouldShow3Year && (
                      <>
                        <TableRow>
                          <TableCell rowSpan={3}>3 Year</TableCell>
                          <TableCell>No Upfront</TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_3_year_no_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.compute_savings_plan_3_year_no_upfront_total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_3_year_no_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Partial Upfront</TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_3_year_partial_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>All Upfront</TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_3_year_all_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.compute_savings_plan_3_year_all_upfront_total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.compute_savings_plan_3_year_all_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {shouldShowSP && (
              <div>
                <h4 className="font-medium">EC2 Savings Plan</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Upfront</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shouldShow1Year && (
                      <>
                        <TableRow>
                          <TableCell rowSpan={3}>1 Year</TableCell>
                          <TableCell>No Upfront</TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_1_year_no_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.ec2_savings_plan_1_year_no_upfront_total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_1_year_no_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Partial Upfront</TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_1_year_partial_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>All Upfront</TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_1_year_all_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.ec2_savings_plan_1_year_all_upfront_total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_1_year_all_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    )}
                    {shouldShow3Year && (
                      <>
                        <TableRow>
                          <TableCell rowSpan={3}>3 Year</TableCell>
                          <TableCell>No Upfront</TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_3_year_no_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.ec2_savings_plan_3_year_no_upfront_total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_3_year_no_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Partial Upfront</TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_3_year_partial_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>All Upfront</TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_3_year_all_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.ec2_savings_plan_3_year_all_upfront_total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.ec2_savings_plan_3_year_all_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {shouldShowRI && (
              <div>
                <h4 className="font-medium">Standard Reserved Instance</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Upfront</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shouldShow1Year && (
                      <>
                        <TableRow>
                          <TableCell rowSpan={3}>1 Year</TableCell>
                          <TableCell>No Upfront</TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_1_year_no_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.standard_reserved_instance_1_year_no_upfront_total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_1_year_no_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Partial Upfront</TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_1_year_partial_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>All Upfront</TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_1_year_all_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.standard_reserved_instance_1_year_all_upfront_total_cost,
                              1,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_1_year_all_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    )}
                    {shouldShow3Year && (
                      <>
                        <TableRow>
                          <TableCell rowSpan={3}>3 Year</TableCell>
                          <TableCell>No Upfront</TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_3_year_no_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.standard_reserved_instance_3_year_no_upfront_total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_3_year_no_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Partial Upfront</TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_3_year_partial_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>All Upfront</TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_3_year_all_upfront_hourly_rate.toFixed(5)}</TableCell>
                          <TableCell>
                            {calculateDiscount(
                              pricing_results.on_demand_hourly_rate,
                              pricing_results.standard_reserved_instance_3_year_all_upfront_total_cost,
                              3,
                            )}
                          </TableCell>
                          <TableCell>${pricing_results.standard_reserved_instance_3_year_all_upfront_total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error rendering PricingResultCard:', error, result)
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-destructive">
          Error rendering pricing results. Check console for details.
        </div>
      </div>
    )
  }
}