// Input types for EC2 instance data
export interface EC2InstanceInput {
  region_code: string
  instance_type: string
  operation: string
  operating_system: string
  product_tenancy: string
  qty: number
}

// Partial upfront cost breakdown
export interface PartialUpfrontCost {
  total_cost: number
  upfront_fee: number
  plan_cost: number
}

// Pricing results for a single instance
export interface PricingResults {
  // On-Demand pricing
  on_demand_hourly_rate: number
  on_demand_1_year_total_cost: number
  on_demand_3_year_total_cost: number

  // Compute Savings Plan 1 Year
  compute_savings_plan_1_year_no_upfront_total_cost: number
  compute_savings_plan_1_year_no_upfront_hourly_rate: number
  compute_savings_plan_1_year_partial_upfront_total_cost: PartialUpfrontCost
  compute_savings_plan_1_year_partial_upfront_hourly_rate: number
  compute_savings_plan_1_year_all_upfront_total_cost: number
  compute_savings_plan_1_year_all_upfront_hourly_rate: number

  // Compute Savings Plan 3 Year
  compute_savings_plan_3_year_no_upfront_total_cost: number
  compute_savings_plan_3_year_no_upfront_hourly_rate: number
  compute_savings_plan_3_year_partial_upfront_total_cost: PartialUpfrontCost
  compute_savings_plan_3_year_partial_upfront_hourly_rate: number
  compute_savings_plan_3_year_all_upfront_total_cost: number
  compute_savings_plan_3_year_all_upfront_hourly_rate: number

  // EC2 Savings Plan 1 Year
  ec2_savings_plan_1_year_no_upfront_total_cost: number
  ec2_savings_plan_1_year_no_upfront_hourly_rate: number
  ec2_savings_plan_1_year_partial_upfront_total_cost: PartialUpfrontCost
  ec2_savings_plan_1_year_partial_upfront_hourly_rate: number
  ec2_savings_plan_1_year_all_upfront_total_cost: number
  ec2_savings_plan_1_year_all_upfront_hourly_rate: number

  // EC2 Savings Plan 3 Year
  ec2_savings_plan_3_year_no_upfront_total_cost: number
  ec2_savings_plan_3_year_no_upfront_hourly_rate: number
  ec2_savings_plan_3_year_partial_upfront_total_cost: PartialUpfrontCost
  ec2_savings_plan_3_year_partial_upfront_hourly_rate: number
  ec2_savings_plan_3_year_all_upfront_total_cost: number
  ec2_savings_plan_3_year_all_upfront_hourly_rate: number

  // Standard Reserved Instance 1 Year
  standard_reserved_instance_1_year_no_upfront_total_cost: number
  standard_reserved_instance_1_year_no_upfront_hourly_rate: number
  standard_reserved_instance_1_year_partial_upfront_total_cost: PartialUpfrontCost
  standard_reserved_instance_1_year_partial_upfront_hourly_rate: number
  standard_reserved_instance_1_year_all_upfront_total_cost: number
  standard_reserved_instance_1_year_all_upfront_hourly_rate: number

  // Standard Reserved Instance 3 Year
  standard_reserved_instance_3_year_no_upfront_total_cost: number
  standard_reserved_instance_3_year_no_upfront_hourly_rate: number
  standard_reserved_instance_3_year_partial_upfront_total_cost: PartialUpfrontCost
  standard_reserved_instance_3_year_partial_upfront_hourly_rate: number
  standard_reserved_instance_3_year_all_upfront_total_cost: number
  standard_reserved_instance_3_year_all_upfront_hourly_rate: number
}

// API response for pricing a single or multiple instances
export interface PricingResponse {
  input_data: EC2InstanceInput
  pricing_results: PricingResults
  errors: string[]
}

// Query filters for pricing explorer
export interface PricingDataFilters {
  region?: string
  os_type?: string
  instance_type?: string
  instance_family?: string
  term?: string
  savings_type?: string
}

// Generic API error response
export interface APIError {
  detail: string
  status?: number
}