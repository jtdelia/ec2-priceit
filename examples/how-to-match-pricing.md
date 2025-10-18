# How to match pricing 

This document describes how to match input data taken from a specially formatted report from DoiT's Cloud Analytics reporting with the AWS pricing files downloaded in to BigQuery.


### Input file
Here is a sample -- see cost-input.csv.  The first line will be a header.

```
Value,aws/region_code,aws/instance_type,Operation,aws/operating_system,aws/product_tenancy,2025-06
Actual,ap-northeast-1,c5.xlarge,RunInstances:0002,Windows,Shared,1
Actual,ap-northeast-1,c5a.large,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,c6i.2xlarge,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,c7a.2xlarge,RunInstances,Linux,Shared,2
Actual,ap-northeast-1,c7a.4xlarge,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,c7a.large,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,c7a.xlarge,RunInstances:0002,Windows,Shared,1
Actual,ap-northeast-1,c7i.large,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,m6i.2xlarge,RunInstances,Linux,Shared,8
Actual,ap-northeast-1,m6i.large,RunInstances,Linux,Shared,2
Actual,ap-northeast-1,m6i.xlarge,RunInstances,Linux,Shared,7
Actual,ap-northeast-1,m6id.large,RunInstances:0002,Windows,Shared,1
Actual,ap-northeast-1,m7a.xlarge,RunInstances,Linux,Shared,2
Actual,ap-northeast-1,m7i-flex.2xlarge,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,m7i-flex.xlarge,RunInstances,Linux,Shared,2
Actual,ap-northeast-1,r6i.xlarge,RunInstances:0002,Windows,Shared,1
Actual,ap-northeast-1,r7a.xlarge,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,t2.large,RunInstances:0002,Windows,Shared,1
Actual,ap-northeast-1,t2.medium,RunInstances,Linux,Shared,2
Actual,ap-northeast-1,t2.medium,RunInstances:0002,Windows,Shared,7
Actual,ap-northeast-1,t2.micro,RunInstances,Linux,Shared,2
Actual,ap-northeast-1,t2.micro,RunInstances:0002,Windows,Shared,3
Actual,ap-northeast-1,t3.medium,RunInstances,Linux,Shared,1
Actual,ap-northeast-1,t3.micro,RunInstances:0002,Windows,Shared,2
Actual,ap-northeast-1,t3.small,RunInstances,Linux,Shared,4
Actual,ap-northeast-1,t3.xlarge,RunInstances:0002,Windows,Shared,1
Actual,ap-northeast-3,c5.xlarge,RunInstances,Linux,Shared,1
```

Input column to price list field mapping:
`Value`:  This is just an artifact from the DoiT reporting tool and should be dropped from the final output
`aws/region_code`: region code.  match to `region_code` in global pricing guide for EC2 on-demand and reserved instances.  For savings plan pricing, match `discounttedregioncode`
`aws/instance_type`:  the instance type (CPU, RAM config) of the server, such as `t2.large`, match `instancetyepe` in the global price list for on-demand and reserved instances, match to `discountedregiontype` in savings plans files
,`Operation`: this is the same as the pricing files and translates to an operating system, needed to know if the OS is linux, windows, windows with SQL server, etc. for license charges.  
`aws/operating_system`: this field is just for human readability -- it is a field taken from billing data to allow a human to easily determine the operating system of the instance.  this is not needed for matching, but keep in the output for human convenience
`aws/product_tenancy`: Usually `shared` but can be `dedicated`.   Maps to `tenancy` in the global price list for on-demand and reserved instances, and does not exist in the savings plans files.
`2025-06`: last column.  this will be a quanity of servers, but the header may be anything and should be changed to QTY by the application.

### Pricing scenarios

The app should price out the following pricing scenarios:
- on-demand hourly rate
- on-demand 1 year total cost
- on-demand 3 year total cost
- compute savings plan 1 year no upfront total cost
- compute savings plan 1 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- compute savings plan 1 year all upfront total cost 
- compute savings plan 3 year no upfront total cost
- compute savings plan 3 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- compute savings plan 3 year all upfront total cost 
- ec2 savings plan 1 year no upfront total cost
- ec2 savings plan 1 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- ec2 savings plan 1 year all upfront total cost 
- ec2 savings plan 3 year no upfront total cost
- ec2 savings plan 3 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- ec2 savings plan 3 year all upfront total cost 
- standard reserved instance 1 year no upfront total cost
- standard reserved instance 1 year partial upfront total cost (break out by the upfront cost and the ri cost)
- standard reserved instance 1 year all upfront total cost 
- standard reserved instance 3 year no upfront total cost
- standard reserved instance 3 year partial upfront total cost (break out by the upfront cost and the ri cost)
- standard reserved instance 3 year all upfront total cost

DO NOT price flexible reserved instances, as Amazon will be deprecating these and we don't want to use them.

To match pricing in the global pricing list, look up the provided fields from the input file in the global pricing table in BigQuery.

Example:

Here is the input file line (headers given for extra context):

Value,aws/region_code,aws/instance_type,Operation,aws/operating_system,aws/product_tenancy,2025-06
Actual,ap-northeast-1,c5.xlarge,RunInstances:0002,Windows,Shared,1

Here is how we map the fields in the input file --> the global pricing table:
Value --> not used, this is an artifact of the report used to create 
aws/region_code --> region_code
aws/instance_type --> instance_type
Operation --> operation
aws/product_tenancy --> tenancy

Use these fields to query the global pricing file in BQ to find the on-demand pricing and reserved instance pricing.  Use the regional pricing files for compute savings plans and ec2 savings plans.

### On-Demand Pricing

Here's a sample query using the example from the input file for the c5.xlarge instance in ap-northeast-1 running Windows.
```
SELECT sku, termtype, pricedescription, priceperunit, instance_type, usagetype, operating_system 
FROM `johnd-dev-01.ec2_pricing_files.ec2_global_pricing_20250926182136`  
WHERE region_code="ap-northeast-1" and instance_type="c5.xlarge" and operation = "RunInstances:0002" and tenancy="Shared" and termtype="OnDemand" and usagetype like "%BoxUsage%"
```

This returns the following result:
```
[{
  "sku": "KR2NPP9N7R68MJVX",
  "region_code": "ap-northeast-1",
  "termtype": "OnDemand",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "$0.398 per On Demand Windows c5.xlarge Instance Hour",
  "priceperunit": "0.3980000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": null,
  "purchaseoption": null,
  "offeringclass": null
}]
```

So the on-demand rate per hour is $0.3980000000 per hour.  To get 1 year and 3 year Total Cost of Ownership, use 8,760 hours for 1 year, 26,280 hours for 3 years, mulitplied by the hourly rate.

This would provide answers for these pricing scenarios:
- on-demand hourly rate
- on-demand 1 year total cost
- on-demand 3 year total cost


### Reserved Instance Pricing

To get reserved instance pricing, this query will get all of the standard reserved pricing.  

```
SELECT sku, region_code, termtype, instance_type, usagetype, operating_system, pricedescription, priceperunit, unit, currency, leasecontractlength, purchaseoption, offeringclass
FROM `johnd-dev-01.ec2_pricing_files.ec2_global_pricing_latest`  
WHERE region_code="ap-northeast-1" and instance_type="c5.xlarge" and operation = "RunInstances:0002" and tenancy="Shared" and termtype like "Reserved" and usagetype like "%BoxUsage%" and offeringclass="standard" 
```

Here's a result in json

```
[{
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Upfront Fee",
  "priceperunit": "2714",
  "unit": "Quantity",
  "currency": "USD",
  "leasecontractlength": "1yr",
  "purchaseoption": "All Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Upfront Fee",
  "priceperunit": "1368",
  "unit": "Quantity",
  "currency": "USD",
  "leasecontractlength": "1yr",
  "purchaseoption": "Partial Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Windows (Amazon VPC), c5.xlarge reserved instance applied",
  "priceperunit": "0.3190000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": "1yr",
  "purchaseoption": "No Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Windows (Amazon VPC), c5.xlarge reserved instance applied",
  "priceperunit": "0.1560000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": "1yr",
  "purchaseoption": "Partial Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "USD 0.0 per Windows (Amazon VPC), c5.xlarge reserved instance applied",
  "priceperunit": "0.0000000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": "1yr",
  "purchaseoption": "All Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Upfront Fee",
  "priceperunit": "3543",
  "unit": "Quantity",
  "currency": "USD",
  "leasecontractlength": "3yr",
  "purchaseoption": "Partial Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Upfront Fee",
  "priceperunit": "6950",
  "unit": "Quantity",
  "currency": "USD",
  "leasecontractlength": "3yr",
  "purchaseoption": "All Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Windows (Amazon VPC), c5.xlarge reserved instance applied",
  "priceperunit": "0.1350000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": "3yr",
  "purchaseoption": "Partial Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "Windows (Amazon VPC), c5.xlarge reserved instance applied",
  "priceperunit": "0.2760000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": "3yr",
  "purchaseoption": "No Upfront",
  "offeringclass": "standard"
}, {
  "region_code": "ap-northeast-1",
  "termtype": "Reserved",
  "instance_type": "c5.xlarge",
  "usagetype": "APN1-BoxUsage:c5.xlarge",
  "operating_system": "Windows",
  "pricedescription": "USD 0.0 per Windows (Amazon VPC), c5.xlarge reserved instance applied",
  "priceperunit": "0.0000000000",
  "unit": "Hrs",
  "currency": "USD",
  "leasecontractlength": "3yr",
  "purchaseoption": "All Upfront",
  "offeringclass": "standard"
}]
```


Instead of multiple queries, the app should pull the data out appropriately.  This data should answer all of these scenarios:

- standard reserved instance 1 year no upfront total cost
- standard reserved instance 1 year partial upfront total cost (break out by the upfront cost and the ri cost)
- standard reserved instance 1 year all upfront total cost 
- standard reserved instance 3 year no upfront total cost
- standard reserved instance 3 year partial upfront total cost (break out by the upfront cost and the ri cost)
- standard reserved instance 3 year all upfront total cost


For `standard reserved instance 1 year no upfront total cost` and `standard reserved instance 3 year no upfront total cost` there is only one cost component -- the hourly rate.  There is a $0 cost fee, but we don't need to consider it.

For `standard reserved instance 1 year partial upfront total cost` and `standard reserved instance 3 year partial upfront total cost` there are two cost components -- the hourly rate * the term and the upfront fee, which is a one time payment.  Costs for both should be broken out in the output file, but for TCO calculations, they should be added up.  

For `standard reserved instance 1 year all upfront total cost` and `standard reserved instance 3 year all upfront total cost` there is only the upfront fee, the hourly cost will be $0.

For all the matching, match the `leasecontractlength` and `purchaseoption` for each scenario.


### Compute Savings Plan Pricing

To get compute savings plan pricing, use the regional savings plan pricing files.  Here is a sample query for the same c5.xlarge instance in ap-northeast-1 running Windows.

```
SELECT sku, discountedregioncode, discountedinstancetype, product_family, usagetype, discountedusagetype, discountedoperation, purchaseoption, leasecontractlength, leasecontractlengthunit, discountedrate, currency, unit
FROM `johnd-dev-01.ec2_pricing_files.savings_plan_ap_northeast_1_latest` 
WHERE discountedregioncode="ap-northeast-1" and discountedinstancetype="c5.xlarge" and discountedoperation = "RunInstances:0002" and discountedusagetype like "%-BoxUsage%" and product_family = "ComputeSavingsPlans"
```

Here is the result in json:

```
[{
  "sku": "BB7BKBSC6NZW7P5B",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "ComputeSavingsPlans",
  "usagetype": "ComputeSP:1yrNoUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "No Upfront",
  "leasecontractlength": "1",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.361",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "RQRC4CUNT9HUG9WC",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "ComputeSavingsPlans",
  "usagetype": "ComputeSP:3yrAllUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "All Upfront",
  "leasecontractlength": "3",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.299",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "2MHX3QZPD4ABTS29",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "ComputeSavingsPlans",
  "usagetype": "ComputeSP:3yrPartialUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "Partial Upfront",
  "leasecontractlength": "3",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.301",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "RHUDT3BFKYZK745U",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "ComputeSavingsPlans",
  "usagetype": "ComputeSP:1yrPartialUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "Partial Upfront",
  "leasecontractlength": "1",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.352",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "ZGC49G7XS8QA54BQ",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "ComputeSavingsPlans",
  "usagetype": "ComputeSP:3yrNoUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "No Upfront",
  "leasecontractlength": "3",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.31",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "8GU23DFTKP2N43SD",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "ComputeSavingsPlans",
  "usagetype": "ComputeSP:1yrAllUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "All Upfront",
  "leasecontractlength": "1",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.349",
  "currency": "USD",
  "unit": "Hrs"
}]
```

This would get data to get pricing data for these scenarios:

- compute savings plan 1 year no upfront total cost
- compute savings plan 1 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- compute savings plan 1 year all upfront total cost 
- compute savings plan 3 year no upfront total cost
- compute savings plan 3 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- compute savings plan 3 year all upfront total cost 

To calculate TCO pricing for compute savings plans:

For `compute savings plan 1 year no upfront total cost` and `compute savings plan 3 year no upfront total cost` there is only one cost component -- the hourly rate.  There is a $0 cost fee, but we don't need to consider it.  Multiply the `discountedrate` * the number of hours in the `leasecontractlegnth` 1 year or 3 year -- use 8,760 hours for 1 year, 26,280 hours for 3 years.

For `compute savings plan 1 year partial upfront total cost` and `compute savings plan 3 year partial upfront total cost` there are two cost components -- the hourly rate and the upfront fee.  To get the TCO, multiply the `discountedrate` * the number of hours in the `leasecontractlegnth` 1 year or 3 year -- use 8,760 hours for 1 year, 26,280 hours for 3 years.  

For `compute savings plan 1 year all upfront total cost` and `compute savings plan 3 year all upfront total cost` the TCO is multiply the `discountedrate` * the number of hours in the `leasecontractlegnth` 1 year or 3 year -- use 8,760 hours for 1 year, 26,280 hours for 3 years.  This would be an upfront fee, paid all at once.

### EC2 savings plan pricing

To get ec2 savings plan pricing, use the regional savings plan pricing files.  Here is a sample query for the same c5.xlarge instance in ap-northeast-1 running Windows.

```
SELECT sku, discountedregioncode, discountedinstancetype, product_family, usagetype, discountedusagetype, discountedoperation, purchaseoption, leasecontractlength, leasecontractlengthunit, discountedrate, currency, unit
FROM `johnd-dev-01.ec2_pricing_files.savings_plan_ap_northeast_1_latest` 
WHERE discountedregioncode="ap-northeast-1" and discountedinstancetype="c5.xlarge" and discountedoperation = "RunInstances:0002" and discountedusagetype like "%-BoxUsage%" and product_family = "EC2InstanceSavingsPlans"
```

Here is the result in json:

```
[{
  "sku": "HG9V2UBQC2P9GB3T",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "EC2InstanceSavingsPlans",
  "usagetype": "APN1-EC2SP:c5.3yrAllUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "All Upfront",
  "leasecontractlength": "3",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.264",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "NR8NXC6QR7UP6QNB",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "EC2InstanceSavingsPlans",
  "usagetype": "APN1-EC2SP:c5.1yrAllUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "All Upfront",
  "leasecontractlength": "1",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.31",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "CFDB8QC6UH3G25GT",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "EC2InstanceSavingsPlans",
  "usagetype": "APN1-EC2SP:c5.1yrNoUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "No Upfront",
  "leasecontractlength": "1",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.319",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "YAHZVTWX63K99G54",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "EC2InstanceSavingsPlans",
  "usagetype": "APN1-EC2SP:c5.3yrPartialUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "Partial Upfront",
  "leasecontractlength": "3",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.27",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "GCZSABBAY2CCJWYQ",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "EC2InstanceSavingsPlans",
  "usagetype": "APN1-EC2SP:c5.1yrPartialUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "Partial Upfront",
  "leasecontractlength": "1",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.312",
  "currency": "USD",
  "unit": "Hrs"
}, {
  "sku": "HDF4M56ZSWFPZUPA",
  "discountedregioncode": "ap-northeast-1",
  "discountedinstancetype": "c5.xlarge",
  "product_family": "EC2InstanceSavingsPlans",
  "usagetype": "APN1-EC2SP:c5.3yrNoUpfront",
  "discountedusagetype": "APN1-BoxUsage:c5.xlarge",
  "discountedoperation": "RunInstances:0002",
  "purchaseoption": "No Upfront",
  "leasecontractlength": "3",
  "leasecontractlengthunit": "year",
  "discountedrate": "0.276",
  "currency": "USD",
  "unit": "Hrs"
}]
```

This gives information to provide pricing in these scenarios:

- ec2 savings plan 1 year no upfront total cost
- ec2 savings plan 1 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- ec2 savings plan 1 year all upfront total cost 
- ec2 savings plan 3 year no upfront total cost
- ec2 savings plan 3 year partial upfront total cost (break out by the upfront cost and the savings plan cost)
- ec2 savings plan 3 year all upfront total cost 

To calculate TCO pricing for ec2 savings plans:

For `ec2 savings plan 1 year no upfront total cost` and `ec2 savings plan 3 year no upfront total cost` there is only one cost component -- the hourly rate.  There is a $0 cost fee, but we don't need to consider it.  Multiply the `discountedrate` * the number of hours in the `leasecontractlegnth` 1 year or 3 year -- use 8,760 hours for 1 year, 26,280 hours for 3 years.

For `ec2 savings plan 1 year partial upfront total cost` and `ec2 savings plan 3 year partial upfront total cost` there are two cost components -- the hourly rate and the upfront fee.  To get the TCO, multiply the `discountedrate` * the number of hours in the `leasecontractlegnth` 1 year or 3 year -- use 8,760 hours for 1 year, 26,280 hours for 3 years.  

For `ec2 savings plan 1 year all upfront total cost ` and `ec2 savings plan 3 year all upfront total cost` the TCO is multiply the `discountedrate` * the number of hours in the `leasecontractlegnth` 1 year or 3 year -- use 8,760 hours for 1 year, 26,280 hours for 3 years.  This would be an upfront fee, paid all at once.