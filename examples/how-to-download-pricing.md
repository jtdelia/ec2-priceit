# How to download Amazon EC2 pricing manually.

1. Download and parse the service index file from https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/index.json and find the reference for `AmazonEC2`.  It should look like this:

```
    "AmazonEC2" : {
      "offerCode" : "AmazonEC2",
      "versionIndexUrl" : "/offers/v1.0/aws/AmazonEC2/index.json",
      "currentVersionUrl" : "/offers/v1.0/aws/AmazonEC2/current/index.json",
      "currentRegionIndexUrl" : "/offers/v1.0/aws/AmazonEC2/current/region_index.json",
      "savingsPlanVersionIndexUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/current/index.json",
      "currentSavingsPlanIndexUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/current/region_index.json"
    },
```

Example file examples/1-global-service-index.json


2.  Check https://pricing.us-east-1.amazonaws.com/ + `versionIndexUrl` (https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/index.json) for the latest version which should be at the bottom of the index file.   It should look like this at the bottom:

```
{
...
    "20250828212014" : {
      "versionEffectiveBeginDate" : "2025-08-01T00:00:00Z",
      "versionEffectiveEndDate" : "2025-09-01T00:00:00Z",
      "offerVersionUrl" : "/offers/v1.0/aws/AmazonEC2/20250828212014/index.json"
    },
    "20250912225308" : {
      "versionEffectiveBeginDate" : "2025-09-01T00:00:00Z",
      "versionEffectiveEndDate" : "",
      "offerVersionUrl" : "/offers/v1.0/aws/AmazonEC2/20250912225308/index.json"
    }
  }

```

See file examples/2-versionIndexUrl-file.json

3.  Download the global pricing list from https://pricing.us-east-1.amazonaws.com + `offerVersionUrl` except, instead of using .json, use .csv to get the global pricing list in csv format.  Example:  https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/20250912225308/index.csv


This file should look like this:
```
"FormatVersion","v1.0"
"Disclaimer","This pricing list is for informational purposes only. All prices are subject to the additional terms included in the pricing pages on http://aws.amazon.com. All Free Tier prices are also subject to the terms included at https://aws.amazon.com/free/"
"Publication Date","2025-09-12T22:53:08Z"
"Version","20250912225308"
"OfferCode","AmazonEC2"
"SKU","OfferTermCode","RateCode","TermType","PriceDescription","EffectiveDate","StartingRange","EndingRange","Unit","PricePerUnit","Currency","RelatedTo","LeaseContractLength","PurchaseOption","OfferingClass","Product Family","serviceCode","Location","Location Type","Instance Type","Current Generation","Instance Family","vCPU","Physical Processor","Clock Speed","Memory","Storage","Network Performance","Processor Architecture","Storage Media","Volume Type","Max Volume Size","Max IOPS/volume","Max IOPS Burst Performance","Max throughput/volume","Provisioned","Tenancy","EBS Optimized","Operating System","License Model","Group","Group Description","Transfer Type","From Location","From Location Type","To Location","To Location Type","usageType","operation","AvailabilityZone","CapacityStatus","ClassicNetworkingSupport","Dedicated EBS Throughput","ECU","Elastic Graphics Type","Enhanced Networking Supported","From Region Code","GPU","GPU Memory","Instance","Instance Capacity - 10xlarge","Instance Capacity - 12xlarge","Instance Capacity - 16xlarge","Instance Capacity - 18xlarge","Instance Capacity - 24xlarge","Instance Capacity - 2xlarge","Instance Capacity - 32xlarge","Instance Capacity - 4xlarge","Instance Capacity - 8xlarge","Instance Capacity - 9xlarge","Instance Capacity - large","Instance Capacity - medium","Instance Capacity - metal","Instance Capacity - xlarge","instanceSKU","Intel AVX2 Available","Intel AVX Available","Intel Turbo Available","MarketOption","Normalization Size Factor","Physical Cores","Pre Installed S/W","Processor Features","Product Type","Region Code","Resource Type","serviceName","SnapshotArchiveFeeType","To Region Code","Volume API Name","VPCNetworkingSupport"
"2223B6PCG6QAUYY6","38NPMPTW36","2223B6PCG6QAUYY6.38NPMPTW36.6YS6EN2CT7","Reserved","Windows with SQL Server Web (Amazon VPC), c6i.large reserved instance applied","2025-09-12","0","Inf","Hrs","0.1046300000","USD",,"3yr","Partial Upfront","standard","Compute Instance","AmazonEC2","Asia Pacific (Tokyo)","AWS Region","c6i.large","Yes","Compute optimized","2","Intel Xeon 8375C (Ice Lake)","3.5 GHz","4 GiB","EBS only","Up to 12500 Megabit","64-bit",,,,,,,,"Dedicated",,"Windows","No License required",,,,,,,,"APN1-DedicatedUsage:c6i.large","RunInstances:0202","NA","Used","false","Up to 10000 Mbps","NA",,"Yes",,,"NA",,,,,,,,,,,,,,,,,"Yes","Yes","Yes","OnDemand","4",,"SQL Web","Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo",,"ap-northeast-1",,"Amazon Elastic Compute Cloud",,,,"true"
"2223B6PCG6QAUYY6","38NPMPTW36","2223B6PCG6QAUYY6.38NPMPTW36.2TG2D8R56U","Reserved","Upfront Fee","2025-09-12",,,"Quantity","2750","USD",,"3yr","Partial Upfront","standard","Compute Instance","AmazonEC2","Asia Pacific (Tokyo)","AWS Region","c6i.large","Yes","Compute optimized","2","Intel Xeon 8375C (Ice Lake)","3.5 GHz","4 GiB","EBS only","Up to 12500 Megabit","64-bit",,,,,,,,"Dedicated",,"Windows","No License required",,,,,,,,"APN1-DedicatedUsage:c6i.large","RunInstances:0202","NA","Used","false","Up to 10000 Mbps","NA",,"Yes",,,"NA",,,,,,,,,,,,,,,,,"Yes","Yes","Yes","OnDemand","4",,"SQL Web","Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo",,"ap-northeast-1",,"Amazon Elastic Compute Cloud",,,,"true"
...
```
This pricing file has all the global EC2 pricing for on-demand and reserved instances.  Note line 6 has the headers needed for creating a schema.

See example file examples/3-global-pricing-file-sample.csv  
Note this only has a small number of SKUs.  The full file is several GB in size.

4.  If the global pricing list has been updated then also download all of the regions.  Get a list of the regions (currentSavingsPlanIndexUrl) from this URL: https://pricing.us-east-1.amazonaws.com/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/current/region_index.json

Parse the list for regions and their respective URLs.

Here's a sample of the top of the file:

```
{
  "disclaimer" : "This pricing list is for informational purposes only. All prices are subject to the additional terms included in the pricing pages on http://aws.amazon.com. All Free Tier prices are also subject to the terms included at https://aws.amazon.com/free/",
  "publicationDate" : "2025-09-11T18:44:47Z",
  "regions" : [ {
    "regionCode" : "us-west-2-den-1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/us-west-2-den-1/index.json"
  }, {
    "regionCode" : "us-east-1-phl-1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/us-east-1-phl-1/index.json"
  }, {
    "regionCode" : "ap-southeast-2-akl-1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/ap-southeast-2-akl-1/index.json"
  }, {
    "regionCode" : "us-west-2-phx-1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/us-west-2-phx-1/index.json"
  }, {
    "regionCode" : "us-east-1-wl1-chi1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/us-east-1-wl1-chi1/index.json"
  }, {
    "regionCode" : "ap-east-2",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/ap-east-2/index.json"
  }, {
    "regionCode" : "us-east-1-wl1-foe1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/us-east-1-wl1-foe1/index.json"
  }, {
    "regionCode" : "us-west-2-sea-1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/us-west-2-sea-1/index.json"
  }, {
    "regionCode" : "eu-west-2-wl1-man1",
    "versionUrl" : "/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/eu-west-2-wl1-man1/index.json"
...
  }
]
}
```

Here's a full file: examples/4-currentSavingsPlanIndexUrl-list.json

5.  Itterate downloads for each of the regions' URLs.  For example, to download the savings plan pricing data for region `ap-east-2` get the csv file from https://pricing.us-east-1.amazonaws.com/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/20250911184447/ap-east-2/index.csv

The file should look like this:
```
FormatVersion,v1.0
Disclaimer,This pricing list is for informational purposes only. All prices are subject to the additional terms included in the pricing pages on http://aws.amazon.com. All Free Tier prices are also subject to the terms included at https://aws.amazon.com/free/
Publication Date,2025-09-11T18:44:47Z
Version,20250911184447
OfferCode,AmazonComputeSavingsPlan
SKU,RateCode,Unit,EffectiveDate,DiscountedRate,Currency,DiscountedSKU,DiscountedServiceCode,DiscountedUsageType,DiscountedOperation,PurchaseOption,LeaseContractLength,LeaseContractLengthUnit,ServiceCode,UsageType,Operation,Description,Instance Family,Location,Location Type,Granularity,Product Family,DiscountedRegionCode,DiscountedInstanceType
2JT7C3ZD2AXA73Q4,2JT7C3ZD2AXA73Q4.23PWZ6X8AQE4NKNR,Hrs,2025-06-05T18:51:13Z,0.0425,USD,23PWZ6X8AQE4NKNR,AmazonEC2,APE2-DedicatedUsage:r7g.medium,RunInstances:0010,Partial Upfront,3,year,ComputeSavingsPlans,APE2-EC2SP:r7g.3yrPartialUpfront,,3 year Partial Upfront r7g EC2 Instance Savings Plan in ap-east-2,r7g,Asia Pacific (Taipei),AWS Region,hourly,EC2InstanceSavingsPlans,ap-east-2,r7g.medium
2JT7C3ZD2AXA73Q4,2JT7C3ZD2AXA73Q4.28DXD4M5FZD3DMKB,Hrs,2025-06-05T18:51:13Z,0.2399,USD,28DXD4M5FZD3DMKB,AmazonEC2,APE2-DedicatedUsage:r7g.xlarge,RunInstances:1010,Partial Upfront,3,year,ComputeSavingsPlans,APE2-EC2SP:r7g.3yrPartialUpfront,,3 year Partial Upfront r7g EC2 Instance Savings Plan in ap-east-2,r7g,Asia Pacific (Taipei),AWS Region,hourly,EC2InstanceSavingsPlans,ap-east-2,r7g.xlarge
2JT7C3ZD2AXA73Q4,2JT7C3ZD2AXA73Q4.2GKZZWX3JXB9PGVM,Hrs,2025-06-05T18:51:13Z,1.6358,USD,2GKZZWX3JXB9PGVM,AmazonEC2,APE2-DedicatedUsage:r7g.16xlarge,RunInstances:0g00,Partial Upfront,3,year,ComputeSavingsPlans,APE2-EC2SP:r7g.3yrPartialUpfront,,3 year Partial Upfront r7g EC2 Instance Savings Plan in ap-east-2,r7g,Asia Pacific (Taipei),AWS Region,hourly,EC2InstanceSavingsPlans,ap-east-2,r7g.16xlarge
2JT7C3ZD2AXA73Q4,2JT7C3ZD2AXA73Q4.2N9JCBAMRPFYYSVR,Hrs,2025-06-05T18:51:13Z,0.0562,USD,2N9JCBAMRPFYYSVR,AmazonEC2,APE2-UnusedDed:r7g.large,RunInstances,Partial Upfront,3,year,ComputeSavingsPlans,APE2-EC2SP:r7g.3yrPartialUpfront,,3 year Partial Upfront r7g EC2 Instance Savings Plan in ap-east-2,r7g,Asia Pacific (Taipei),AWS Region,hourly,EC2InstanceSavingsPlans,ap-east-2,r7g.large
...
```
The headers are on line 6.  These can be used for the scheme.  The scheme for the regional savings plans will be the same, but savings plans schema differs from the global price list that has on-demand and reserved instance pricing, so be careful.


The files will be large.  Here's a bigger sample:  examples/5-ap-east-2-savingsplan-pricing.csv

### NOTE: As these files are large, upload each price list in to big query as soon as the download is complete before moving on to another download.  Ensure to clean up any temp files to free up space as these files are multiple gigabytes in size and the Cloud Run resources will be limited.