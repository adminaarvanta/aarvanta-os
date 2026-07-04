import { getIndustryProfile } from "@/lib/ageb/industries";

const DEMO_METRICS: Record<string, Array<{ label: string; value: string; benchmark?: string }>> = {
  retail_ecommerce: [
    { label: "Conversion rate", value: "2.4%", benchmark: "Industry 2.1%" },
    { label: "Avg. order value", value: "£38", benchmark: "Last 30 days" },
    { label: "Cart abandonment", value: "68%", benchmark: "Target <65%" },
    { label: "Repeat purchase rate", value: "12%", benchmark: "Growing" },
  ],
  professional_services: [
    { label: "Utilization rate", value: "74%", benchmark: "Target 75%" },
    { label: "Billable hours", value: "128h", benchmark: "This month" },
    { label: "Active projects", value: "6", benchmark: "2 due this week" },
    { label: "Client NPS", value: "42", benchmark: "Above average" },
  ],
  restaurant_hospitality: [
    { label: "Covers (weekly)", value: "840", benchmark: "+5% vs last week" },
    { label: "Table turnover", value: "2.1×", benchmark: "Peak Fri–Sat" },
    { label: "Food cost %", value: "31%", benchmark: "Target 30%" },
    { label: "Labour cost %", value: "28%", benchmark: "On target" },
  ],
  healthcare: [
    { label: "Appointments", value: "156", benchmark: "This week" },
    { label: "No-show rate", value: "4.2%", benchmark: "Below 5% target" },
    { label: "Patient satisfaction", value: "4.6/5", benchmark: "Stable" },
    { label: "Wait time (avg)", value: "12 min", benchmark: "Target 15 min" },
  ],
  manufacturing: [
    { label: "OEE", value: "78%", benchmark: "Target 80%" },
    { label: "Defect rate", value: "0.8%", benchmark: "Within SLA" },
    { label: "Units produced", value: "4,200", benchmark: "This month" },
    { label: "Downtime", value: "6.5h", benchmark: "Planned maintenance" },
  ],
  construction: [
    { label: "Projects on site", value: "3", benchmark: "1 ahead of schedule" },
    { label: "Safety incidents", value: "0", benchmark: "30-day streak" },
    { label: "Budget variance", value: "-2.1%", benchmark: "Under budget" },
    { label: "Subcontractor score", value: "91%", benchmark: "Compliance" },
  ],
};

export function getIndustryKpis(industryProfileId: string) {
  const profile = getIndustryProfile(industryProfileId);
  return {
    industryProfileId,
    label: profile?.label ?? industryProfileId,
    kpis: profile?.kpis ?? [],
    metrics: DEMO_METRICS[industryProfileId] ?? DEMO_METRICS.retail_ecommerce!,
  };
}
