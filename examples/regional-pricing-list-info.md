# Bigquery ec2_global_pricing_latest table

This file explains the schema and provides a sample of the AWS regional savings plan pricing lists in Bigquery.  The region name will be in the table title, in this example, its region `ap-northeast-1` written in a table name of `savings_plan_ap_northeast_1_latest`

## Schema query
```
SELECT column_name, data_type 
FROM `johnd-dev-01.ec2_pricing_files.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'savings_plan_ap_northeast_1_latest';
```

## result
```
column_name,data_type
sku,STRING
ratecode,STRING
unit,STRING
effectivedate,STRING
discountedrate,STRING
currency,STRING
discountedsku,STRING
discountedservicecode,STRING
discountedusagetype,STRING
discountedoperation,STRING
purchaseoption,STRING
leasecontractlength,STRING
leasecontractlengthunit,STRING
servicecode,STRING
usagetype,STRING
operation,STRING
description,STRING
instance_family,STRING
location,STRING
location_type,STRING
granularity,STRING
product_family,STRING
discountedregioncode,STRING
discountedinstancetype,STRING
```


## Sample query 
```
SELECT * FROM `johnd-dev-01.ec2_pricing_files.savings_plan_ap_northeast_1_latest`
WHERE discountedregioncode = 'ap-northeast-1' 
AND discountedinstancetype = 'c5.xlarge'
LIMIT 10;

```



## Result in csv:

```
sku,ratecode,unit,effectivedate,discountedrate,currency,discountedsku,discountedservicecode,discountedusagetype,discountedoperation,purchaseoption,leasecontractlength,leasecontractlengthunit,servicecode,usagetype,operation,description,instance_family,location,location_type,granularity,product_family,discountedregioncode,discountedinstancetype
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.2E92YMZ2XD6UMPWS,Hrs,2024-07-01T07:36:03Z,0.151,USD,2E92YMZ2XD6UMPWS,AmazonEC2,APN1-UnusedDed:c5.xlarge,RunInstances:0010,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.2NSX58SPVDESYAQX,Hrs,2024-07-01T07:36:03Z,0.631,USD,2NSX58SPVDESYAQX,AmazonEC2,APN1-DedicatedUsage:c5.xlarge,RunInstances:0014,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.3G57AH59D68H3JZT,Hrs,2024-07-01T07:36:03Z,1.638,USD,3G57AH59D68H3JZT,AmazonEC2,APN1-UnusedBox:c5.xlarge,RunInstances:0110,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.4BY86BGNNFM5VRXW,Hrs,2024-07-01T07:36:03Z,1.777,USD,4BY86BGNNFM5VRXW,AmazonEC2,APN1-DedicatedUsage:c5.xlarge,RunInstances:0102,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.4JZCRU75NF8YGS7G,Hrs,2024-07-01T07:36:03Z,0.184,USD,4JZCRU75NF8YGS7G,AmazonEC2,APN1-HostBoxUsage:c5.xlarge,RunInstances:0002,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.5A4QNT5JW6V6TVRC,Hrs,2024-07-01T07:36:03Z,0.219,USD,5A4QNT5JW6V6TVRC,AmazonEC2,APN1-UnusedDed:c5.xlarge,RunInstances:0210,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.5P4BVT6ZCX2NTTT2,Hrs,2024-07-01T07:36:03Z,1.651,USD,5P4BVT6ZCX2NTTT2,AmazonEC2,APN1-UnusedDed:c5.xlarge,RunInstances:0110,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.6M4VRYUCSMMP5JVR,Hrs,2024-07-01T07:36:03Z,0.332,USD,6M4VRYUCSMMP5JVR,AmazonEC2,APN1-UnusedBox:c5.xlarge,RunInstances:0202,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.6MKYQ4AWYGHHVKCC,Hrs,2024-07-01T07:36:03Z,0.264,USD,6MKYQ4AWYGHHVKCC,AmazonEC2,APN1-UnusedBox:c5.xlarge,RunInstances:0002,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
HG9V2UBQC2P9GB3T,HG9V2UBQC2P9GB3T.779UNUPV3DHNGM82,Hrs,2024-07-01T07:36:03Z,0.701,USD,779UNUPV3DHNGM82,AmazonEC2,APN1-DedicatedUsage:c5.xlarge,RunInstances:1014,All Upfront,3,year,ComputeSavingsPlans,APN1-EC2SP:c5.3yrAllUpfront,,3 year All Upfront c5 EC2 Instance Savings Plan in ap-northeast-1,c5,Asia Pacific (Tokyo),AWS Region,hourly,EC2InstanceSavingsPlans,ap-northeast-1,c5.xlarge
```