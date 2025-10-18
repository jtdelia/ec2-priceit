import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDashboardStore } from "@/store/useDashboardStore";

export const FilterPanel = () => {
  const { filters, setFilters } = useDashboardStore();

  const handlePlanTypeChange = (value: string) => {
    setFilters({ planType: value });
  };

  const handleTermChange = (value: string) => {
    setFilters({ term: value });
  };

  const handleOsChange = (os: string, checked: boolean) => {
    const newOs = checked
      ? [...filters.os, os]
      : filters.os.filter((o) => o !== os);
    setFilters({ os: newOs });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan-type">Plan Type</Label>
          <Select value={filters.planType} onValueChange={handlePlanTypeChange}>
            <SelectTrigger id="plan-type">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="on-demand">On-Demand</SelectItem>
              <SelectItem value="ri">Reserved Instance</SelectItem>
              <SelectItem value="sp">Savings Plan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="term">Term</Label>
          <Select value={filters.term} onValueChange={handleTermChange}>
            <SelectTrigger id="term">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1yr">1 Year</SelectItem>
              <SelectItem value="3yr">3 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Operating System</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="os-linux"
              checked={filters.os.includes("linux")}
              onCheckedChange={(checked) => handleOsChange("linux", checked as boolean)}
            />
            <Label htmlFor="os-linux">Linux</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="os-windows"
              checked={filters.os.includes("windows")}
              onCheckedChange={(checked) => handleOsChange("windows", checked as boolean)}
            />
            <Label htmlFor="os-windows">Windows</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};