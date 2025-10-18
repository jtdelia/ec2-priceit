# AWS Calculator Ouput

This document has output from the AWS caulculator which can be seen as a source of truth to check lookups.  The aws calcuator is at https://calculator.aws/

The input data example is:
```
Actual,ap-northeast-1,c5.xlarge,RunInstances:0002,Windows,Shared,1
```

This AWS calculator output is for a c5.xlarge using a Windows Server license (Runinstances:0002) in region ap-northeast-1, shared tenancy, qty 1.

The following sections are actual outputs from the AWS Calculator.

### On-Demand
```
1 instances x 0.398 USD On Demand hourly cost x 730 hours in a month = 290.540000 USD
On-Demand instances (monthly): 290.540000 USD
```

###  standard reserved instance 1 year no upfront 
```
1 Reserved instances x 0.000000 USD upfront cost = 0.000000 USD

Reservation instances (upfront): 0.000000 USD
1 instances x 730 hours in a month = 730 Reserved instance hours per month
730 Reserved instance hours per month x 0.319000 USD = 232.870000 USD

Normalized Reserved instances (monthly): 232.870000 USD
```

### standard reserved instance 1 year partial upfront 
```
1 Reserved instances x 1368.000000 USD upfront cost = 1368.000000 USD

Reservation instances (upfront): 1368.000000 USD
1 instances x 730 hours in a month = 730 Reserved instance hours per month
730 Reserved instance hours per month x 0.156000 USD = 113.880000 USD

Normalized Reserved instances (monthly): 113.880000 USD
```

### standard reserved instance 1 year all upfront 
```
1 Reserved instances x 2714.000000 USD upfront cost = 2714.000000 USD

Reservation instances (upfront): 2714.000000 USD
1 instances x 730 hours in a month = 730 Reserved instance hours per month
730 Reserved instance hours per month x 0.000000 USD = 0.000000 USD

Normalized Reserved instances (monthly): 0.000000 USD
```


### standard reserved instance 3 year no upfront
```
1 Reserved instances x 0.000000 USD upfront cost = 0.000000 USD

Reservation instances (upfront): 0.000000 USD
1 instances x 730 hours in a month = 730 Reserved instance hours per month
730 Reserved instance hours per month x 0.276000 USD = 201.480000 USD

Normalized Reserved instances (monthly): 201.480000 USD
```

### standard reserved instance 3 year partial upfront
```
1 Reserved instances x 3543.000000 USD upfront cost = 3543.000000 USD

Reservation instances (upfront): 3543.000000 USD
1 instances x 730 hours in a month = 730 Reserved instance hours per month
730 Reserved instance hours per month x 0.135000 USD = 98.550000 USD

Normalized Reserved instances (monthly): 98.550000 USD
```


### standard reserved instance 3 year all upfront
```
1 Reserved instances x 6950.000000 USD upfront cost = 6950.000000 USD

Reservation instances (upfront): 6950.000000 USD
1 instances x 730 hours in a month = 730 Reserved instance hours per month
730 Reserved instance hours per month x 0.000000 USD = 0.000000 USD

Normalized Reserved instances (monthly): 0.000000 USD
```

### compute savings plan 1 year no upfront 
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when Compute Savings Plans instances are more cost effective to use than On-Demand Instances.

Compute Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 1 Year term and No Upfront is 0.361 USD
Hours in the commitment: 365 days * 24 hours * 1 year = 8760.0000 hours
Total Commitment: 0.361 USD * 8760 hours = 3162.3600 USD
Upfront: No Upfront (0% of 3162.36) = 0.0000 USD
Hourly cost for Compute Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (3162.36 - 0.00)/8760 = 0.3610 USD
Normalized Compute Savings Plans monthly price: (0.000000 USD / 12 months) + (0.361000 USD x 730 hours in a month) = 263.530000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 263.530000 USD / 290.540000 USD = 0.90703517587939698492
Breakeven point: 0.90703517587939698492 x 730 hours in month = 662.135678 hours

Utilization summary
For instance utilization over the breakeven point, 662.135678 hours, it is more cost effective to choose Compute Savings Plans instances than On-Demand Instances.

1 Compute Savings Plans instances x 0.000000 upfront cost = 0.000000 USD

Compute Savings Plans instances (upfront): 0.000000 USD
1 instances x 730 hours in a month = 730 Compute Savings Plans instance hours per month
730 Compute Savings Plans instance hours per month x 0.361000 USD = 263.530000 USD

Normalized Compute Savings Plans instances (monthly): 263.530000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 263.530000 USD Normalized Compute Savings Plans instances (monthly) = 263.530000 USD

Total cost (monthly): 263.530000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### compute savings plan 1 year partial upfront 
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when Compute Savings Plans instances are more cost effective to use than On-Demand Instances.

Compute Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 1 Year term and Partial Upfront is 0.352 USD
Hours in the commitment: 365 days * 24 hours * 1 year = 8760.0000 hours
Total Commitment: 0.352 USD * 8760 hours = 3083.5200 USD
Upfront: Partial Upfront (50% of 3083.52) = 1541.7600 USD
Hourly cost for Compute Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (3083.52 - 1541.76)/8760 = 0.1760 USD
Normalized Compute Savings Plans monthly price: (1541.760000 USD / 12 months) + (0.176000 USD x 730 hours in a month) = 256.960000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 256.960000 USD / 290.540000 USD = 0.88442211055276381909
Breakeven point: 0.88442211055276381909 x 730 hours in month = 645.628141 hours

Utilization summary
For instance utilization over the breakeven point, 645.628141 hours, it is more cost effective to choose Compute Savings Plans instances than On-Demand Instances.

1 Compute Savings Plans instances x 1541.760000 upfront cost = 1541.760000 USD

Compute Savings Plans instances (upfront): 1541.760000 USD
1 instances x 730 hours in a month = 730 Compute Savings Plans instance hours per month
730 Compute Savings Plans instance hours per month x 0.176000 USD = 128.480000 USD

Normalized Compute Savings Plans instances (monthly): 128.480000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 128.480000 USD Normalized Compute Savings Plans instances (monthly) = 128.480000 USD

Total cost (monthly): 128.480000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### compute savings plan 1 year all upfront 
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when Compute Savings Plans instances are more cost effective to use than On-Demand Instances.

Compute Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 1 Year term and All Upfront is 0.349 USD
Hours in the commitment: 365 days * 24 hours * 1 year = 8760.0000 hours
Total Commitment: 0.349 USD * 8760 hours = 3057.2400 USD
Upfront: All Upfront (100% of 3057.24) = 3057.2400 USD
Hourly cost for Compute Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (3057.24 - 3057.24)/8760 = 0.0000 USD
Normalized Compute Savings Plans monthly price: (3057.240000 USD / 12 months) + (0.000000 USD x 730 hours in a month) = 254.770000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 254.770000 USD / 290.540000 USD = 0.87688442211055276381
Breakeven point: 0.87688442211055276381 x 730 hours in month = 640.125628 hours

Utilization summary
For instance utilization over the breakeven point, 640.125628 hours, it is more cost effective to choose Compute Savings Plans instances than On-Demand Instances.

1 Compute Savings Plans instances x 3057.240000 upfront cost = 3057.240000 USD

Compute Savings Plans instances (upfront): 3057.240000 USD
1 instances x 730 hours in a month = 730 Compute Savings Plans instance hours per month
730 Compute Savings Plans instance hours per month x 0.000000 USD = 0.000000 USD

Normalized Compute Savings Plans instances (monthly): 0.000000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 0.000000 USD Normalized Compute Savings Plans instances (monthly) = 0.000000 USD

Total cost (monthly): 0.000000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### compute savings plan 3 year no upfront
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when Compute Savings Plans instances are more cost effective to use than On-Demand Instances.

Compute Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 3 Year term and No Upfront is 0.31 USD
Hours in the commitment: 365 days * 24 hours * 3 year = 26280.0000 hours
Total Commitment: 0.31 USD * 26280 hours = 8146.8000 USD
Upfront: No Upfront (0% of 8146.8) = 0.0000 USD
Hourly cost for Compute Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (8146.8 - 0.00)/26280 = 0.3100 USD
Normalized Compute Savings Plans monthly price: (0.000000 USD / 36 months) + (0.310000 USD x 730 hours in a month) = 226.300000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 226.300000 USD / 290.540000 USD = 0.77889447236180904522
Breakeven point: 0.77889447236180904522 x 730 hours in month = 568.592965 hours

Utilization summary
For instance utilization over the breakeven point, 568.592965 hours, it is more cost effective to choose Compute Savings Plans instances than On-Demand Instances.

1 Compute Savings Plans instances x 0.000000 upfront cost = 0.000000 USD

Compute Savings Plans instances (upfront): 0.000000 USD
1 instances x 730 hours in a month = 730 Compute Savings Plans instance hours per month
730 Compute Savings Plans instance hours per month x 0.310000 USD = 226.300000 USD

Normalized Compute Savings Plans instances (monthly): 226.300000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 226.300000 USD Normalized Compute Savings Plans instances (monthly) = 226.300000 USD

Total cost (monthly): 226.300000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### compute savings plan 3 year partial upfront
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when Compute Savings Plans instances are more cost effective to use than On-Demand Instances.

Compute Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 3 Year term and Partial Upfront is 0.301 USD
Hours in the commitment: 365 days * 24 hours * 3 year = 26280.0000 hours
Total Commitment: 0.301 USD * 26280 hours = 7910.2800 USD
Upfront: Partial Upfront (50% of 7910.28) = 3955.1400 USD
Hourly cost for Compute Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (7910.28 - 3955.14)/26280 = 0.1505 USD
Normalized Compute Savings Plans monthly price: (3955.140000 USD / 36 months) + (0.150500 USD x 730 hours in a month) = 219.730000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 219.730000 USD / 290.540000 USD = 0.75628140703517587939
Breakeven point: 0.75628140703517587939 x 730 hours in month = 552.085427 hours

Utilization summary
For instance utilization over the breakeven point, 552.085427 hours, it is more cost effective to choose Compute Savings Plans instances than On-Demand Instances.

1 Compute Savings Plans instances x 3955.140000 upfront cost = 3955.140000 USD

Compute Savings Plans instances (upfront): 3955.140000 USD
1 instances x 730 hours in a month = 730 Compute Savings Plans instance hours per month
730 Compute Savings Plans instance hours per month x 0.150500 USD = 109.865000 USD

Normalized Compute Savings Plans instances (monthly): 109.865000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 109.865000 USD Normalized Compute Savings Plans instances (monthly) = 109.865000 USD

Total cost (monthly): 109.865000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### compute savings plan 3 year all upfront 
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when Compute Savings Plans instances are more cost effective to use than On-Demand Instances.

Compute Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 3 Year term and All Upfront is 0.299 USD
Hours in the commitment: 365 days * 24 hours * 3 year = 26280.0000 hours
Total Commitment: 0.299 USD * 26280 hours = 7857.7200 USD
Upfront: All Upfront (100% of 7857.72) = 7857.7200 USD
Hourly cost for Compute Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (7857.72 - 7857.72)/26280 = 0.0000 USD
Normalized Compute Savings Plans monthly price: (7857.720000 USD / 36 months) + (0.000000 USD x 730 hours in a month) = 218.270000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 218.270000 USD / 290.540000 USD = 0.75125628140703517587
Breakeven point: 0.75125628140703517587 x 730 hours in month = 548.417085 hours

Utilization summary
For instance utilization over the breakeven point, 548.417085 hours, it is more cost effective to choose Compute Savings Plans instances than On-Demand Instances.

1 Compute Savings Plans instances x 7857.720000 upfront cost = 7857.720000 USD

Compute Savings Plans instances (upfront): 7857.720000 USD
1 instances x 730 hours in a month = 730 Compute Savings Plans instance hours per month
730 Compute Savings Plans instance hours per month x 0.000000 USD = 0.000000 USD

Normalized Compute Savings Plans instances (monthly): 0.000000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 0.000000 USD Normalized Compute Savings Plans instances (monthly) = 0.000000 USD

Total cost (monthly): 0.000000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### ec2 savings plan 1 year no upfront
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when EC2 Instance Savings Plans instances are more cost effective to use than On-Demand Instances.

EC2 Instance Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 1 Year term and No Upfront is 0.319 USD
Hours in the commitment: 365 days * 24 hours * 1 year = 8760.0000 hours
Total Commitment: 0.319 USD * 8760 hours = 2794.4400 USD
Upfront: No Upfront (0% of 2794.44) = 0.0000 USD
Hourly cost for EC2 Instance Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (2794.44 - 0.00)/8760 = 0.3190 USD
Normalized EC2 Instance Savings Plans monthly price: (0.000000 USD / 12 months) + (0.319000 USD x 730 hours in a month) = 232.870000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 232.870000 USD / 290.540000 USD = 0.80150753768844221105
Breakeven point: 0.80150753768844221105 x 730 hours in month = 585.100503 hours

Utilization summary
For instance utilization over the breakeven point, 585.100503 hours, it is more cost effective to choose EC2 Instance Savings Plans instances than On-Demand Instances.

1 EC2 Instance Savings Plans instances x 0.000000 upfront cost = 0.000000 USD

EC2 Instance Savings Plans instances (upfront): 0.000000 USD
1 instances x 730 hours in a month = 730 EC2 Instance Savings Plans instance hours per month
730 EC2 Instance Savings Plans instance hours per month x 0.319000 USD = 232.870000 USD

Normalized EC2 Instance Savings Plans instances (monthly): 232.870000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 232.870000 USD Normalized EC2 Instance Savings Plans instances (monthly) = 232.870000 USD

Total cost (monthly): 232.870000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### ec2 savings plan 1 year partial upfront
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when EC2 Instance Savings Plans instances are more cost effective to use than On-Demand Instances.

EC2 Instance Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 1 Year term and Partial Upfront is 0.312 USD
Hours in the commitment: 365 days * 24 hours * 1 year = 8760.0000 hours
Total Commitment: 0.312 USD * 8760 hours = 2733.1200 USD
Upfront: Partial Upfront (50% of 2733.12) = 1366.5600 USD
Hourly cost for EC2 Instance Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (2733.12 - 1366.56)/8760 = 0.1560 USD
Normalized EC2 Instance Savings Plans monthly price: (1366.560000 USD / 12 months) + (0.156000 USD x 730 hours in a month) = 227.760000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 227.760000 USD / 290.540000 USD = 0.78391959798994974874
Breakeven point: 0.78391959798994974874 x 730 hours in month = 572.261307 hours

Utilization summary
For instance utilization over the breakeven point, 572.261307 hours, it is more cost effective to choose EC2 Instance Savings Plans instances than On-Demand Instances.

1 EC2 Instance Savings Plans instances x 1366.560000 upfront cost = 1366.560000 USD

EC2 Instance Savings Plans instances (upfront): 1366.560000 USD
1 instances x 730 hours in a month = 730 EC2 Instance Savings Plans instance hours per month
730 EC2 Instance Savings Plans instance hours per month x 0.156000 USD = 113.880000 USD

Normalized EC2 Instance Savings Plans instances (monthly): 113.880000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 113.880000 USD Normalized EC2 Instance Savings Plans instances (monthly) = 113.880000 USD

Total cost (monthly): 113.880000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```



### ec2 savings plan 1 year all upfront 
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when EC2 Instance Savings Plans instances are more cost effective to use than On-Demand Instances.

EC2 Instance Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 1 Year term and All Upfront is 0.31 USD
Hours in the commitment: 365 days * 24 hours * 1 year = 8760.0000 hours
Total Commitment: 0.31 USD * 8760 hours = 2715.6000 USD
Upfront: All Upfront (100% of 2715.6) = 2715.6000 USD
Hourly cost for EC2 Instance Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (2715.6 - 2715.60)/8760 = 0.0000 USD
Normalized EC2 Instance Savings Plans monthly price: (2715.600000 USD / 12 months) + (0.000000 USD x 730 hours in a month) = 226.300000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 226.300000 USD / 290.540000 USD = 0.77889447236180904522
Breakeven point: 0.77889447236180904522 x 730 hours in month = 568.592965 hours

Utilization summary
For instance utilization over the breakeven point, 568.592965 hours, it is more cost effective to choose EC2 Instance Savings Plans instances than On-Demand Instances.

1 EC2 Instance Savings Plans instances x 2715.600000 upfront cost = 2715.600000 USD

EC2 Instance Savings Plans instances (upfront): 2715.600000 USD
1 instances x 730 hours in a month = 730 EC2 Instance Savings Plans instance hours per month
730 EC2 Instance Savings Plans instance hours per month x 0.000000 USD = 0.000000 USD

Normalized EC2 Instance Savings Plans instances (monthly): 0.000000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 0.000000 USD Normalized EC2 Instance Savings Plans instances (monthly) = 0.000000 USD

Total cost (monthly): 0.000000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```

### ec2 savings plan 3 year no upfront
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when EC2 Instance Savings Plans instances are more cost effective to use than On-Demand Instances.

EC2 Instance Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 3 Year term and No Upfront is 0.276 USD
Hours in the commitment: 365 days * 24 hours * 3 year = 26280.0000 hours
Total Commitment: 0.276 USD * 26280 hours = 7253.2800 USD
Upfront: No Upfront (0% of 7253.28) = 0.0000 USD
Hourly cost for EC2 Instance Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (7253.28 - 0.00)/26280 = 0.2760 USD
Normalized EC2 Instance Savings Plans monthly price: (0.000000 USD / 36 months) + (0.276000 USD x 730 hours in a month) = 201.480000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 201.480000 USD / 290.540000 USD = 0.69346733668341701005
Breakeven point: 0.69346733668341701005 x 730 hours in month = 506.231156 hours

Utilization summary
For instance utilization over the breakeven point, 506.231156 hours, it is more cost effective to choose EC2 Instance Savings Plans instances than On-Demand Instances.

1 EC2 Instance Savings Plans instances x 0.000000 upfront cost = 0.000000 USD

EC2 Instance Savings Plans instances (upfront): 0.000000 USD
1 instances x 730 hours in a month = 730 EC2 Instance Savings Plans instance hours per month
730 EC2 Instance Savings Plans instance hours per month x 0.276000 USD = 201.480000 USD

Normalized EC2 Instance Savings Plans instances (monthly): 201.480000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 201.480000 USD Normalized EC2 Instance Savings Plans instances (monthly) = 201.480000 USD

Total cost (monthly): 201.480000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```


### ec2 savings plan 3 year partial upfront
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when EC2 Instance Savings Plans instances are more cost effective to use than On-Demand Instances.

EC2 Instance Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 3 Year term and Partial Upfront is 0.27 USD
Hours in the commitment: 365 days * 24 hours * 3 year = 26280.0000 hours
Total Commitment: 0.27 USD * 26280 hours = 7095.6000 USD
Upfront: Partial Upfront (50% of 7095.6) = 3547.8000 USD
Hourly cost for EC2 Instance Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (7095.6 - 3547.80)/26280 = 0.1350 USD
Normalized EC2 Instance Savings Plans monthly price: (3547.800000 USD / 36 months) + (0.135000 USD x 730 hours in a month) = 197.100000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 197.100000 USD / 290.540000 USD = 0.67839195979899497487
Breakeven point: 0.67839195979899497487 x 730 hours in month = 495.226131 hours

Utilization summary
For instance utilization over the breakeven point, 495.226131 hours, it is more cost effective to choose EC2 Instance Savings Plans instances than On-Demand Instances.

1 EC2 Instance Savings Plans instances x 3547.800000 upfront cost = 3547.800000 USD

EC2 Instance Savings Plans instances (upfront): 3547.800000 USD
1 instances x 730 hours in a month = 730 EC2 Instance Savings Plans instance hours per month
730 EC2 Instance Savings Plans instance hours per month x 0.135000 USD = 98.550000 USD

Normalized EC2 Instance Savings Plans instances (monthly): 98.550000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 98.550000 USD Normalized EC2 Instance Savings Plans instances (monthly) = 98.550000 USD

Total cost (monthly): 98.550000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```

### ec2 savings plan 3 year all upfront 
```
Breakeven analysis
A cost-optimized strategy for your utilization is found by calculating the breakeven point when EC2 Instance Savings Plans instances are more cost effective to use than On-Demand Instances.

EC2 Instance Savings Plans rate for c5.xlarge in the Asia Pacific (Tokyo) for 3 Year term and All Upfront is 0.264 USD
Hours in the commitment: 365 days * 24 hours * 3 year = 26280.0000 hours
Total Commitment: 0.264 USD * 26280 hours = 6937.9200 USD
Upfront: All Upfront (100% of 6937.92) = 6937.9200 USD
Hourly cost for EC2 Instance Savings Plans = (Total Commitment - Upfront cost)/Hours in the term: (6937.92 - 6937.92)/26280 = 0.0000 USD
Normalized EC2 Instance Savings Plans monthly price: (6937.920000 USD / 36 months) + (0.000000 USD x 730 hours in a month) = 192.720000 USD
On-Demand hourly price: 0.398000 USD
Normalized On-Demand monthly price: 0.398000 USD x 730 hours in a month = 290.540000 USD
Breakeven percentage: 192.720000 USD / 290.540000 USD = 0.66331658291457286432
Breakeven point: 0.66331658291457286432 x 730 hours in month = 484.221106 hours

Utilization summary
For instance utilization over the breakeven point, 484.221106 hours, it is more cost effective to choose EC2 Instance Savings Plans instances than On-Demand Instances.

1 EC2 Instance Savings Plans instances x 6937.920000 upfront cost = 6937.920000 USD

EC2 Instance Savings Plans instances (upfront): 6937.920000 USD
1 instances x 730 hours in a month = 730 EC2 Instance Savings Plans instance hours per month
730 EC2 Instance Savings Plans instance hours per month x 0.000000 USD = 0.000000 USD

Normalized EC2 Instance Savings Plans instances (monthly): 0.000000 USD
0 On-Demand instance hours per month x 0.398000 USD = 0.000000 USD

On-Demand (monthly): 0.000000 USD
0.000000 USD On-Demand (monthly) + 0.000000 USD Normalized EC2 Instance Savings Plans instances (monthly) = 0.000000 USD

Total cost (monthly): 0.000000 USD
*Please note that you will pay an hourly commitment for Savings Plans and your usage will be accrued at a discounted rate against this commitment.
```