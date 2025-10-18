import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useExportHistory } from "@/context/ExportHistoryContext";
import { useTelemetry } from "@/hooks/useTelemetry";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const ExportButton = () => {
  const { results, fileName } = useDashboardStore();
  const { tokens, status } = useAuth();
  const { toast } = useToast();
  const { addExport } = useExportHistory();
  const { trackExport, trackError } = useTelemetry();

  const handleExportCSV = () => {
    // Generate timestamp for unique filename
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;

    // Transform results to CSV format
    const csvData = results.map(result => ({
      // Input data
      region_code: result.input_data.region_code,
      instance_type: result.input_data.instance_type,
      operation: result.input_data.operation,
      operating_system: result.input_data.operating_system,
      product_tenancy: result.input_data.product_tenancy,
      qty: result.input_data.qty,

      // On-Demand pricing
      on_demand_hourly_rate: result.pricing_results.on_demand_hourly_rate,
      on_demand_1_year_total_cost: result.pricing_results.on_demand_1_year_total_cost,
      on_demand_3_year_total_cost: result.pricing_results.on_demand_3_year_total_cost,

      // Compute Savings Plan 1 Year
      compute_savings_plan_1_year_no_upfront_total_cost: result.pricing_results.compute_savings_plan_1_year_no_upfront_total_cost,
      compute_savings_plan_1_year_no_upfront_hourly_rate: result.pricing_results.compute_savings_plan_1_year_no_upfront_hourly_rate,
      compute_savings_plan_1_year_partial_upfront_total_cost: result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.total_cost,
      compute_savings_plan_1_year_partial_upfront_upfront_fee: result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.upfront_fee,
      compute_savings_plan_1_year_partial_upfront_plan_cost: result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.plan_cost,
      compute_savings_plan_1_year_partial_upfront_hourly_rate: result.pricing_results.compute_savings_plan_1_year_partial_upfront_hourly_rate,
      compute_savings_plan_1_year_all_upfront_total_cost: result.pricing_results.compute_savings_plan_1_year_all_upfront_total_cost,
      compute_savings_plan_1_year_all_upfront_hourly_rate: result.pricing_results.compute_savings_plan_1_year_all_upfront_hourly_rate,

      // Compute Savings Plan 3 Year
      compute_savings_plan_3_year_no_upfront_total_cost: result.pricing_results.compute_savings_plan_3_year_no_upfront_total_cost,
      compute_savings_plan_3_year_no_upfront_hourly_rate: result.pricing_results.compute_savings_plan_3_year_no_upfront_hourly_rate,
      compute_savings_plan_3_year_partial_upfront_total_cost: result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.total_cost,
      compute_savings_plan_3_year_partial_upfront_upfront_fee: result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.upfront_fee,
      compute_savings_plan_3_year_partial_upfront_plan_cost: result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.plan_cost,
      compute_savings_plan_3_year_partial_upfront_hourly_rate: result.pricing_results.compute_savings_plan_3_year_partial_upfront_hourly_rate,
      compute_savings_plan_3_year_all_upfront_total_cost: result.pricing_results.compute_savings_plan_3_year_all_upfront_total_cost,
      compute_savings_plan_3_year_all_upfront_hourly_rate: result.pricing_results.compute_savings_plan_3_year_all_upfront_hourly_rate,

      // EC2 Savings Plan 1 Year
      ec2_savings_plan_1_year_no_upfront_total_cost: result.pricing_results.ec2_savings_plan_1_year_no_upfront_total_cost,
      ec2_savings_plan_1_year_no_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_1_year_no_upfront_hourly_rate,
      ec2_savings_plan_1_year_partial_upfront_total_cost: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.total_cost,
      ec2_savings_plan_1_year_partial_upfront_upfront_fee: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.upfront_fee,
      ec2_savings_plan_1_year_partial_upfront_plan_cost: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.plan_cost,
      ec2_savings_plan_1_year_partial_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_hourly_rate,
      ec2_savings_plan_1_year_all_upfront_total_cost: result.pricing_results.ec2_savings_plan_1_year_all_upfront_total_cost,
      ec2_savings_plan_1_year_all_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_1_year_all_upfront_hourly_rate,

      // EC2 Savings Plan 3 Year
      ec2_savings_plan_3_year_no_upfront_total_cost: result.pricing_results.ec2_savings_plan_3_year_no_upfront_total_cost,
      ec2_savings_plan_3_year_no_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_3_year_no_upfront_hourly_rate,
      ec2_savings_plan_3_year_partial_upfront_total_cost: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.total_cost,
      ec2_savings_plan_3_year_partial_upfront_upfront_fee: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.upfront_fee,
      ec2_savings_plan_3_year_partial_upfront_plan_cost: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.plan_cost,
      ec2_savings_plan_3_year_partial_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_hourly_rate,
      ec2_savings_plan_3_year_all_upfront_total_cost: result.pricing_results.ec2_savings_plan_3_year_all_upfront_total_cost,
      ec2_savings_plan_3_year_all_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_3_year_all_upfront_hourly_rate,

      // Standard Reserved Instance 1 Year
      standard_reserved_instance_1_year_no_upfront_total_cost: result.pricing_results.standard_reserved_instance_1_year_no_upfront_total_cost,
      standard_reserved_instance_1_year_no_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_1_year_no_upfront_hourly_rate,
      standard_reserved_instance_1_year_partial_upfront_total_cost: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.total_cost,
      standard_reserved_instance_1_year_partial_upfront_upfront_fee: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.upfront_fee,
      standard_reserved_instance_1_year_partial_upfront_plan_cost: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.plan_cost,
      standard_reserved_instance_1_year_partial_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_hourly_rate,
      standard_reserved_instance_1_year_all_upfront_total_cost: result.pricing_results.standard_reserved_instance_1_year_all_upfront_total_cost,
      standard_reserved_instance_1_year_all_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_1_year_all_upfront_hourly_rate,

      // Standard Reserved Instance 3 Year
      standard_reserved_instance_3_year_no_upfront_total_cost: result.pricing_results.standard_reserved_instance_3_year_no_upfront_total_cost,
      standard_reserved_instance_3_year_no_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_3_year_no_upfront_hourly_rate,
      standard_reserved_instance_3_year_partial_upfront_total_cost: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.total_cost,
      standard_reserved_instance_3_year_partial_upfront_upfront_fee: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.upfront_fee,
      standard_reserved_instance_3_year_partial_upfront_plan_cost: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.plan_cost,
      standard_reserved_instance_3_year_partial_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_hourly_rate,
      standard_reserved_instance_3_year_all_upfront_total_cost: result.pricing_results.standard_reserved_instance_3_year_all_upfront_total_cost,
      standard_reserved_instance_3_year_all_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_3_year_all_upfront_hourly_rate,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const baseName = fileName ? fileName.replace(/\.csv$/i, '') : 'pricing';
    const fileNameWithTimestamp = `${baseName}-export-${timestamp}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileNameWithTimestamp);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track export
    trackExport('csv', results.length);

    // Record the export
    addExport({
      type: 'csv',
      status: 'success',
      fileName: fileNameWithTimestamp,
      recordCount: results.length,
    });
  };

  const handleExportExcel = () => {
    // Generate timestamp for unique filename
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;

    // Transform results to Excel format (same as CSV)
    const excelData = results.map(result => ({
      // Input data
      region_code: result.input_data.region_code,
      instance_type: result.input_data.instance_type,
      operation: result.input_data.operation,
      operating_system: result.input_data.operating_system,
      product_tenancy: result.input_data.product_tenancy,
      qty: result.input_data.qty,

      // On-Demand pricing
      on_demand_hourly_rate: result.pricing_results.on_demand_hourly_rate,
      on_demand_1_year_total_cost: result.pricing_results.on_demand_1_year_total_cost,
      on_demand_3_year_total_cost: result.pricing_results.on_demand_3_year_total_cost,

      // Compute Savings Plan 1 Year
      compute_savings_plan_1_year_no_upfront_total_cost: result.pricing_results.compute_savings_plan_1_year_no_upfront_total_cost,
      compute_savings_plan_1_year_no_upfront_hourly_rate: result.pricing_results.compute_savings_plan_1_year_no_upfront_hourly_rate,
      compute_savings_plan_1_year_partial_upfront_total_cost: result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.total_cost,
      compute_savings_plan_1_year_partial_upfront_upfront_fee: result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.upfront_fee,
      compute_savings_plan_1_year_partial_upfront_plan_cost: result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost.plan_cost,
      compute_savings_plan_1_year_partial_upfront_hourly_rate: result.pricing_results.compute_savings_plan_1_year_partial_upfront_hourly_rate,
      compute_savings_plan_1_year_all_upfront_total_cost: result.pricing_results.compute_savings_plan_1_year_all_upfront_total_cost,
      compute_savings_plan_1_year_all_upfront_hourly_rate: result.pricing_results.compute_savings_plan_1_year_all_upfront_hourly_rate,

      // Compute Savings Plan 3 Year
      compute_savings_plan_3_year_no_upfront_total_cost: result.pricing_results.compute_savings_plan_3_year_no_upfront_total_cost,
      compute_savings_plan_3_year_no_upfront_hourly_rate: result.pricing_results.compute_savings_plan_3_year_no_upfront_hourly_rate,
      compute_savings_plan_3_year_partial_upfront_total_cost: result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.total_cost,
      compute_savings_plan_3_year_partial_upfront_upfront_fee: result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.upfront_fee,
      compute_savings_plan_3_year_partial_upfront_plan_cost: result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost.plan_cost,
      compute_savings_plan_3_year_partial_upfront_hourly_rate: result.pricing_results.compute_savings_plan_3_year_partial_upfront_hourly_rate,
      compute_savings_plan_3_year_all_upfront_total_cost: result.pricing_results.compute_savings_plan_3_year_all_upfront_total_cost,
      compute_savings_plan_3_year_all_upfront_hourly_rate: result.pricing_results.compute_savings_plan_3_year_all_upfront_hourly_rate,

      // EC2 Savings Plan 1 Year
      ec2_savings_plan_1_year_no_upfront_total_cost: result.pricing_results.ec2_savings_plan_1_year_no_upfront_total_cost,
      ec2_savings_plan_1_year_no_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_1_year_no_upfront_hourly_rate,
      ec2_savings_plan_1_year_partial_upfront_total_cost: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.total_cost,
      ec2_savings_plan_1_year_partial_upfront_upfront_fee: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.upfront_fee,
      ec2_savings_plan_1_year_partial_upfront_plan_cost: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost.plan_cost,
      ec2_savings_plan_1_year_partial_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_1_year_partial_upfront_hourly_rate,
      ec2_savings_plan_1_year_all_upfront_total_cost: result.pricing_results.ec2_savings_plan_1_year_all_upfront_total_cost,
      ec2_savings_plan_1_year_all_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_1_year_all_upfront_hourly_rate,

      // EC2 Savings Plan 3 Year
      ec2_savings_plan_3_year_no_upfront_total_cost: result.pricing_results.ec2_savings_plan_3_year_no_upfront_total_cost,
      ec2_savings_plan_3_year_no_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_3_year_no_upfront_hourly_rate,
      ec2_savings_plan_3_year_partial_upfront_total_cost: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.total_cost,
      ec2_savings_plan_3_year_partial_upfront_upfront_fee: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.upfront_fee,
      ec2_savings_plan_3_year_partial_upfront_plan_cost: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost.plan_cost,
      ec2_savings_plan_3_year_partial_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_3_year_partial_upfront_hourly_rate,
      ec2_savings_plan_3_year_all_upfront_total_cost: result.pricing_results.ec2_savings_plan_3_year_all_upfront_total_cost,
      ec2_savings_plan_3_year_all_upfront_hourly_rate: result.pricing_results.ec2_savings_plan_3_year_all_upfront_hourly_rate,

      // Standard Reserved Instance 1 Year
      standard_reserved_instance_1_year_no_upfront_total_cost: result.pricing_results.standard_reserved_instance_1_year_no_upfront_total_cost,
      standard_reserved_instance_1_year_no_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_1_year_no_upfront_hourly_rate,
      standard_reserved_instance_1_year_partial_upfront_total_cost: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.total_cost,
      standard_reserved_instance_1_year_partial_upfront_upfront_fee: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.upfront_fee,
      standard_reserved_instance_1_year_partial_upfront_plan_cost: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost.plan_cost,
      standard_reserved_instance_1_year_partial_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_1_year_partial_upfront_hourly_rate,
      standard_reserved_instance_1_year_all_upfront_total_cost: result.pricing_results.standard_reserved_instance_1_year_all_upfront_total_cost,
      standard_reserved_instance_1_year_all_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_1_year_all_upfront_hourly_rate,

      // Standard Reserved Instance 3 Year
      standard_reserved_instance_3_year_no_upfront_total_cost: result.pricing_results.standard_reserved_instance_3_year_no_upfront_total_cost,
      standard_reserved_instance_3_year_no_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_3_year_no_upfront_hourly_rate,
      standard_reserved_instance_3_year_partial_upfront_total_cost: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.total_cost,
      standard_reserved_instance_3_year_partial_upfront_upfront_fee: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.upfront_fee,
      standard_reserved_instance_3_year_partial_upfront_plan_cost: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost.plan_cost,
      standard_reserved_instance_3_year_partial_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_3_year_partial_upfront_hourly_rate,
      standard_reserved_instance_3_year_all_upfront_total_cost: result.pricing_results.standard_reserved_instance_3_year_all_upfront_total_cost,
      standard_reserved_instance_3_year_all_upfront_hourly_rate: result.pricing_results.standard_reserved_instance_3_year_all_upfront_hourly_rate,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Pricing Results");

    // Generate filename
    const baseName = fileName ? fileName.replace(/\.csv?$/i, '') : 'pricing';
    const fileNameWithTimestamp = `${baseName}-export-${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, fileNameWithTimestamp);

    // Track export
    trackExport('excel', results.length);

    // Record the export
    addExport({
      type: 'excel',
      status: 'success',
      fileName: fileNameWithTimestamp,
      recordCount: results.length,
    });
  };

  const handleExportGoogleSheets = async () => {
    if (status !== "authenticated" || !tokens?.accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Google account in Settings to export to Google Sheets.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;

    const baseName = fileName ? fileName.replace(/\.csv?$/i, '') : 'pricing';
    const spreadsheetTitle = `${baseName}-export-${timestamp}`;

    try {
      const result = await api.exportToGoogleSheets(results, tokens.accessToken, spreadsheetTitle);

      // Track export
      trackExport('google-sheets', results.length);

      // Record successful export
      addExport({
        type: 'google-sheets',
        status: 'success',
        fileName: spreadsheetTitle,
        recordCount: results.length,
        spreadsheetUrl: result.spreadsheet_url,
      });

      toast({
        title: "Export Successful",
        description: `Data exported to Google Sheets successfully. ${result.spreadsheet_url}`,
      });

      // Open the spreadsheet in a new tab
      window.open(result.spreadsheet_url, '_blank');
    } catch (error) {
      console.error("Google Sheets export failed:", error);

      // Track error
      trackError("google_sheets_export_failed", error instanceof Error ? error.message : 'Unknown error', {
        component: "ExportButton",
        export_type: "google-sheets",
      });

      // Record failed export
      addExport({
        type: 'google-sheets',
        status: 'failed',
        fileName: spreadsheetTitle,
        recordCount: results.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: "Export Failed",
        description: "Failed to export to Google Sheets. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={results.length === 0}>
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportGoogleSheets} disabled={status !== "authenticated" || !tokens?.accessToken}>
          Export to Google Sheets
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};