# Bigquery ec2_global_pricing_latest table

This file explains the schema and provides a sample of the AWS global pricing list in Bigquery.

## Schema query
```
SELECT column_name, data_type 
FROM `johnd-dev-01.ec2_pricing_files.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'ec2_global_pricing_latest';
```

## result
```
column_name,data_type
sku,STRING
offertermcode,STRING
ratecode,STRING
termtype,STRING
pricedescription,STRING
effectivedate,STRING
startingrange,STRING
endingrange,STRING
unit,STRING
priceperunit,STRING
currency,STRING
relatedto,STRING
leasecontractlength,STRING
purchaseoption,STRING
offeringclass,STRING
product_family,STRING
servicecode,STRING
location,STRING
location_type,STRING
instance_type,STRING
current_generation,STRING
instance_family,STRING
vcpu,STRING
physical_processor,STRING
clock_speed,STRING
memory,STRING
storage,STRING
network_performance,STRING
processor_architecture,STRING
storage_media,STRING
volume_type,STRING
max_volume_size,STRING
max_iops_volume,STRING
max_iops_burst_performance,STRING
max_throughput_volume,STRING
provisioned,STRING
tenancy,STRING
ebs_optimized,STRING
operating_system,STRING
license_model,STRING
group,STRING
group_description,STRING
transfer_type,STRING
from_location,STRING
from_location_type,STRING
to_location,STRING
to_location_type,STRING
usagetype,STRING
operation,STRING
availabilityzone,STRING
capacitystatus,STRING
classicnetworkingsupport,STRING
dedicated_ebs_throughput,STRING
dedicated_ebs_throughput_description,STRING
ecu,STRING
elastic_graphics_type,STRING
enhanced_networking_supported,STRING
from_region_code,STRING
gpu,STRING
gpu_memory,STRING
instance,STRING
instance_capacity_10xlarge,STRING
instance_capacity_12xlarge,STRING
instance_capacity_16xlarge,STRING
instance_capacity_18xlarge,STRING
instance_capacity_24xlarge,STRING
instance_capacity_2xlarge,STRING
instance_capacity_32xlarge,STRING
instance_capacity_4xlarge,STRING
instance_capacity_8xlarge,STRING
instance_capacity_9xlarge,STRING
instance_capacity_large,STRING
instance_capacity_medium,STRING
instance_capacity_metal,STRING
instance_capacity_xlarge,STRING
instancesku,STRING
intel_avx2_available,STRING
intel_avx_available,STRING
intel_turbo_available,STRING
marketoption,STRING
normalization_size_factor,STRING
physical_cores,STRING
pre_installed_s_w,STRING
processor_features,STRING
product_type,STRING
region_code,STRING
resource_type,STRING
servicename,STRING
snapshotarchivefeetype,STRING
to_region_code,STRING
volume_api_name,STRING
vpcnetworkingsupport,STRING
```





## Query

```
SELECT * FROM `johnd-dev-01.ec2_pricing_files.ec2_global_pricing_latest`
WHERE region_code = 'ap-northeast-1' 
AND instance_type = 'c5.xlarge'
LIMIT 10;
```

## result

```
sku,offertermcode,ratecode,termtype,pricedescription,effectivedate,startingrange,endingrange,unit,priceperunit,currency,relatedto,leasecontractlength,purchaseoption,offeringclass,product_family,servicecode,location,location_type,instance_type,current_generation,instance_family,vcpu,physical_processor,clock_speed,memory,storage,network_performance,processor_architecture,storage_media,volume_type,max_volume_size,max_iops_volume,max_iops_burst_performance,max_throughput_volume,provisioned,tenancy,ebs_optimized,operating_system,license_model,group,group_description,transfer_type,from_location,from_location_type,to_location,to_location_type,usagetype,operation,availabilityzone,capacitystatus,classicnetworkingsupport,dedicated_ebs_throughput,dedicated_ebs_throughput_description,ecu,elastic_graphics_type,enhanced_networking_supported,from_region_code,gpu,gpu_memory,instance,instance_capacity_10xlarge,instance_capacity_12xlarge,instance_capacity_16xlarge,instance_capacity_18xlarge,instance_capacity_24xlarge,instance_capacity_2xlarge,instance_capacity_32xlarge,instance_capacity_4xlarge,instance_capacity_8xlarge,instance_capacity_9xlarge,instance_capacity_large,instance_capacity_medium,instance_capacity_metal,instance_capacity_xlarge,instancesku,intel_avx2_available,intel_avx_available,intel_turbo_available,marketoption,normalization_size_factor,physical_cores,pre_installed_s_w,processor_features,product_type,region_code,resource_type,servicename,snapshotarchivefeetype,to_region_code,volume_api_name,vpcnetworkingsupport
YUTUYBEEX7BC3M9S,JRTCKXETXF,YUTUYBEEX7BC3M9S.JRTCKXETXF.6YS6EN2CT7,OnDemand,$0.00 per Reservation Windows with SQL Std c5.xlarge Instance Hour,2025-09-01,0,Inf,Hrs,0.0000000000,USD,,,,,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Windows,No License required,,,,,,,,APN1-Reservation:c5.xlarge,RunInstances:0006,NA,AllocatedCapacityReservation,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,FCDCCPUA5UMGUGPB,Yes,Yes,Yes,OnDemand,8,,SQL Std,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
P2GWRADVMMBT9ACU,JRTCKXETXF,P2GWRADVMMBT9ACU.JRTCKXETXF.6YS6EN2CT7,OnDemand,$0.00 per Dedicated Reservation Linux c5.xlarge Instance Hour,2025-09-01,0,Inf,Hrs,0.0000000000,USD,,,,,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Dedicated,,Linux,No License required,,,,,,,,APN1-DedicatedRes:c5.xlarge,RunInstances,NA,AllocatedCapacityReservation,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,EQ3T8HK4X6GPDXEC,Yes,Yes,Yes,OnDemand,8,,NA,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
ASV8WW3AUHGCRFZE,7NE97W5U4E,ASV8WW3AUHGCRFZE.7NE97W5U4E.6YS6EN2CT7,Reserved,"Windows with SQL Server Web (Amazon VPC), c5.xlarge reserved instance applied",2025-09-30,0,Inf,Hrs,0.4430000000,USD,,1yr,No Upfront,convertible,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Dedicated,,Windows,No License required,,,,,,,,APN1-DedicatedUsage:c5.xlarge,RunInstances:0202,NA,Used,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,,Yes,Yes,Yes,OnDemand,8,,SQL Web,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
EP8EJMA4GKSUCMU6,BPH4J8HBKS,EP8EJMA4GKSUCMU6.BPH4J8HBKS.6YS6EN2CT7,Reserved,"Linux/UNIX (Amazon VPC), c5.xlarge reserved instance applied",2025-09-30,0,Inf,Hrs,0.0920000000,USD,,3yr,No Upfront,standard,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Linux,No License required,,,,,,,,APN1-BoxUsage:c5.xlarge,RunInstances,NA,Used,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,,Yes,Yes,Yes,OnDemand,8,,NA,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
9PFK2YWZSHJE2M5B,JRTCKXETXF,9PFK2YWZSHJE2M5B.JRTCKXETXF.6YS6EN2CT7,OnDemand,$0.00 per Reservation Linux with SQL Web c5.xlarge Instance Hour,2025-09-01,0,Inf,Hrs,0.0000000000,USD,,,,,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Linux,No License required,,,,,,,,APN1-Reservation:c5.xlarge,RunInstances:0200,NA,AllocatedCapacityReservation,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,ZAFW829UJP4Q6EZZ,Yes,Yes,Yes,OnDemand,8,,SQL Web,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
68WRYTB8EKUFBA2H,JRTCKXETXF,68WRYTB8EKUFBA2H.JRTCKXETXF.6YS6EN2CT7,OnDemand,$0.00 per Reservation RHEL with HA and SQL Enterprise c5.xlarge Instance Hour,2025-09-01,0,Inf,Hrs,0.0000000000,USD,,,,,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Red Hat Enterprise Linux with HA,No License required,,,,,,,,APN1-Reservation:c5.xlarge,RunInstances:1110,NA,AllocatedCapacityReservation,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,N36AQYCNNKJNH237,Yes,Yes,Yes,OnDemand,8,,SQL Ent,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
N6TNQC6M4Q3QKD7H,NQ3QZPMQV9,N6TNQC6M4Q3QKD7H.NQ3QZPMQV9.6YS6EN2CT7,Reserved,"USD 0.0 per Linux with SQL Server Standard (Amazon VPC), c5.xlarge reserved instance applied",2025-09-30,0,Inf,Hrs,0.0000000000,USD,,3yr,All Upfront,standard,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Linux,No License required,,,,,,,,APN1-BoxUsage:c5.xlarge,RunInstances:0004,NA,Used,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,,Yes,Yes,Yes,OnDemand,8,,SQL Std,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
KR2NPP9N7R68MJVX,6QCMYABX3D,KR2NPP9N7R68MJVX.6QCMYABX3D.2TG2D8R56U,Reserved,Upfront Fee,2025-09-30,,,Quantity,2714,USD,,1yr,All Upfront,standard,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Windows,No License required,,,,,,,,APN1-BoxUsage:c5.xlarge,RunInstances:0002,NA,Used,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,,Yes,Yes,Yes,OnDemand,8,,NA,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
6MKYQ4AWYGHHVKCC,JRTCKXETXF,6MKYQ4AWYGHHVKCC.JRTCKXETXF.6YS6EN2CT7,OnDemand,$0.398 per Unused Reservation Windows c5.xlarge Instance Hour,2025-09-01,0,Inf,Hrs,0.3980000000,USD,,,,,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Shared,,Windows,No License required,,,,,,,,APN1-UnusedBox:c5.xlarge,RunInstances:0002,NA,UnusedCapacityReservation,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,KR2NPP9N7R68MJVX,Yes,Yes,Yes,OnDemand,8,,NA,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
4BY86BGNNFM5VRXW,HU7G6KETJZ,4BY86BGNNFM5VRXW.HU7G6KETJZ.2TG2D8R56U,Reserved,Upfront Fee,2025-09-30,,,Quantity,7995,USD,,1yr,Partial Upfront,standard,Compute Instance,AmazonEC2,Asia Pacific (Tokyo),AWS Region,c5.xlarge,Yes,Compute optimized,4,Intel Xeon Platinum 8124M,3.4 GHz,8 GiB,EBS only,Up to 10 Gigabit,64-bit,,,,,,,,Dedicated,,Windows,No License required,,,,,,,,APN1-DedicatedUsage:c5.xlarge,RunInstances:0102,NA,Used,false,Up to 2250 Mbps,800 Mbps,20,,Yes,,,NA,,,,,,,,,,,,,,,,,Yes,Yes,Yes,OnDemand,8,,SQL Ent,Intel AVX; Intel AVX2; Intel AVX512; Intel Turbo,,ap-northeast-1,,Amazon Elastic Compute Cloud,,,,true
```