import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStore } from "@/store/useDashboardStore";

export const DashboardCharts = () => {
  const { results, filters } = useDashboardStore();

  // Filter results based on filters
  const filteredResults = results.filter((result) => {
    const osMatch = filters.os.includes(result.input_data.operating_system.toLowerCase());
    return osMatch;
  });

  // Determine which pricing keys to include based on filters
  const getPricingKeys = () => {
    const keys: string[] = [];

    // Plan type filtering
    const includeOnDemand = filters.planType === 'all' || filters.planType === 'on-demand';
    const includeRI = filters.planType === 'all' || filters.planType === 'ri';
    const includeSP = filters.planType === 'all' || filters.planType === 'sp';

    // Term filtering
    const include1yr = filters.term === 'all' || filters.term === '1yr';
    const include3yr = filters.term === 'all' || filters.term === '3yr';

    if (includeOnDemand) {
      if (include1yr) keys.push("On-Demand 1yr");
      if (include3yr) keys.push("On-Demand 3yr");
    }
    if (includeRI) {
      if (include1yr) keys.push("RI 1yr");
      if (include3yr) keys.push("RI 3yr");
    }
    if (includeSP) {
      if (include1yr) keys.push("Compute SP 1yr", "EC2 SP 1yr");
      if (include3yr) keys.push("Compute SP 3yr", "EC2 SP 3yr");
    }

    return keys;
  };

  const pricingKeys = getPricingKeys();

  // Transform to chart data format
  const chartData = filteredResults.map((result) => {
    const { pricing_results } = result;
    const data: any = {
      name: result.input_data.instance_type,
    };

    // Only include pricing data for filtered keys
    pricingKeys.forEach(key => {
      switch (key) {
        case "On-Demand 1yr":
          data[key] = pricing_results.on_demand_1_year_total_cost;
          break;
        case "On-Demand 3yr":
          data[key] = pricing_results.on_demand_3_year_total_cost;
          break;
        case "RI 1yr":
          data[key] = pricing_results.standard_reserved_instance_1_year_no_upfront_total_cost;
          break;
        case "RI 3yr":
          data[key] = pricing_results.standard_reserved_instance_3_year_no_upfront_total_cost;
          break;
        case "Compute SP 1yr":
          data[key] = pricing_results.compute_savings_plan_1_year_no_upfront_total_cost;
          break;
        case "Compute SP 3yr":
          data[key] = pricing_results.compute_savings_plan_3_year_no_upfront_total_cost;
          break;
        case "EC2 SP 1yr":
          data[key] = pricing_results.ec2_savings_plan_1_year_no_upfront_total_cost;
          break;
        case "EC2 SP 3yr":
          data[key] = pricing_results.ec2_savings_plan_3_year_no_upfront_total_cost;
          break;
      }
    });

    return data;
  });

  // Define colors for each pricing type
  const getBarColor = (key: string) => {
    if (key.includes("On-Demand")) return "#8884d8";
    if (key.includes("RI")) return "#82ca9d";
    if (key.includes("Compute SP")) return "#ffc658";
    if (key.includes("EC2 SP")) return "#ff7300";
    return "#8884d8";
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Total Cost of Ownership (USD)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {pricingKeys.map((key) => (
            <Bar key={key} dataKey={key} fill={getBarColor(key)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};