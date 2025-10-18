import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/bulk-upload/FileUpload";
import { useDashboardStore } from "@/store/useDashboardStore";
import { api, ApiError } from "@/lib/api";
import Papa from "papaparse";

// Types for CSV parsing
interface CSVRow {
  [key: string]: string | undefined;
}

interface ParsedInstance {
  region_code: string;
  instance_type: string;
  operation: string;
  operating_system: string;
  product_tenancy: string;
  qty: number;
}

const BulkUpload = () => {
  const navigate = useNavigate();
  const { setResults, setFileName, setLoading } = useDashboardStore();

  const mutation = useMutation({
    mutationFn: api.priceInstances,
    onSuccess: (data) => {
      setResults(data);
      navigate("/dashboard");
    },
    onError: (error: ApiError) => {
      console.error("Bulk upload error:", error);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      setResults([], error.message);
      navigate("/dashboard");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setLoading(true);
      const file = files[0];
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("Parsed CSV data:", results.data);
          const transformedData = (results.data as CSVRow[])
            .filter((row) => {
              // Check if it's DoiT format or standard format
              const hasStandard = row.region_code || row.instance_type || row.operation || row.operating_system;
              const hasDoiT = row['aws/region_code'] || row['aws/instance_type'] || row['Operation'] || row['aws/operating_system'];
              return hasStandard || hasDoiT;
            })
            .map((row): ParsedInstance => {
              let region_code, instance_type, operation, operating_system, product_tenancy, qty;

              if (row['aws/region_code']) {
                // DoiT format
                region_code = row['aws/region_code'] || "";
                instance_type = row['aws/instance_type'] || "";
                operation = row['Operation'] || "";
                operating_system = row['aws/operating_system'] || "";
                product_tenancy = row['aws/product_tenancy'] || "Shared";
                // Qty is the last column value
                const values = Object.values(row);
                qty = parseInt(values[values.length - 1] as string, 10) || 1;
              } else {
                // Standard format
                region_code = row.region_code || "";
                instance_type = row.instance_type || "";
                operation = row.operation || "";
                operating_system = row.operating_system || "";
                product_tenancy = row.product_tenancy || "Shared";
                qty = parseInt(row.qty || '1', 10) || 1;
              }

              return {
                region_code,
                instance_type,
                operation,
                operating_system,
                product_tenancy,
                qty,
              };
            })
            .filter((item) => item.region_code && item.instance_type && item.operation && item.operating_system); // Only send valid rows
          console.log("Transformed data:", transformedData);
          if (transformedData.length === 0) {
            setResults([], "No valid data found in the uploaded file. Please check the CSV format and ensure it has the required columns: region_code, instance_type, operation, operating_system");
            navigate("/dashboard");
            return;
          }
          mutation.mutate(transformedData);
        },
        error: (error) => {
          console.error("PapaParse error:", error);
          setLoading(false);
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex items-center justify-center">
        <FileUpload
          onFilesSelected={handleFilesSelected}
          multiple={false}
          disabled={mutation.isPending}
          statusMessage={
            mutation.isPending
              ? "Pricing instances, please wait..."
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default BulkUpload;