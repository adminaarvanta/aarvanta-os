import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipeline,
  CrmTask,
} from "@/types/crm";

/** Demo/local CRM stores start empty — records are created from qualified inbound (Module 1 → 2). */
export const DEMO_CRM_COMPANIES: CrmCompany[] = [];
export const DEMO_CRM_CONTACTS: CrmContact[] = [];
export const DEMO_CRM_PIPELINES: CrmPipeline[] = [];
export const DEMO_CRM_DEALS: CrmDeal[] = [];
export const DEMO_CRM_TASKS: CrmTask[] = [];
export const DEMO_CRM_ACTIVITIES: CrmActivity[] = [];

export const DEMO_CRM_TENANT = DEMO_TENANT;
