"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { EC2InstanceInput, PricingResponse } from "@/types/api"

import { Button } from "@/components/ui/button"
import { PricingResultCard } from "@/components/pricing/PricingResultCard"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTelemetry } from "@/hooks/useTelemetry"

const formSchema = z.object({
  region: z.string().min(1, "Region is required."),
  instanceType: z.string().min(1, "Instance type is required."),
  os: z.string().min(1, "OS is required."),
  term: z.string().min(1, "Term is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1."),
})

const AdHocPricingForm: React.FC = () => {
  const [results, setResults] = React.useState<PricingResponse | null>(null)
  const { toast } = useToast()
  const { trackPricingRequest, trackError } = useTelemetry()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region: "",
      instanceType: "",
      os: "Linux",
      term: "1yr",
      quantity: 1,
    },
  })

  const mutation = useMutation({
    mutationFn: (instance: EC2InstanceInput) => api.priceInstance(instance),
    onSuccess: (data) => {
      console.log('Pricing API success:', data)
      setResults(data)
      toast({
        title: "Success",
        description: "Pricing fetched successfully!",
      })
    },
    onError: (error) => {
      console.error('Pricing API error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch pricing"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      // Track error
      trackError("pricing_request_failed", errorMessage, {
        component: "AdHocPricingForm",
      })
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    const instance: EC2InstanceInput = {
      region_code: data.region,
      instance_type: data.instanceType,
      operating_system: data.os,
      qty: data.quantity,
      // Hardcoded values for now
      operation: "RunInstances",
      product_tenancy: "Shared",
    }

    // Track pricing request
    trackPricingRequest(data.instanceType, data.region, data.os)

    mutation.mutate(instance)
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The AWS region where the instance is located.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instanceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instance Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g., t2.micro" {...field} />
              </FormControl>
              <FormDescription>
                The type of EC2 instance (e.g., t2.micro, m5.large).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="os"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operating System</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an OS" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Linux">Linux</SelectItem>
                  <SelectItem value="Windows">Windows</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The operating system of the instance.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Term</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a term" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1yr">1 Year</SelectItem>
                  <SelectItem value="3yr">3 Years</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The commitment term for the pricing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormDescription>
                The number of instances to price.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Getting Pricing..." : "Get Pricing"}
        </Button>
      </form>
    </Form>
    {results && (
      <div className="mt-8">
        <PricingResultCard result={results} />
      </div>
    )}
  </>
  )
}

export default AdHocPricingForm;