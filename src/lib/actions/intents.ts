/** Business intents exposed via AGEB Volume 8 Business Action API. */

export type BusinessIntent =
  | "create_contact"
  | "create_task"
  | "create_invoice"
  | "run_ai_buddy"
  | "get_business_snapshot"
  | "launch_business"
  | "post_journal_entry"
  | "generate_pl"
  | "reconcile_account"
  | "run_payroll"
  | "generate_payslip"
  | "analyze_contract"
  | "generate_contract"
  | "generate_hr_document"
  | "hire_employee"
  | "start_workflow"
  | "get_industry_kpis";

export type BusinessActionRequest = {
  intent: BusinessIntent;
  context?: Record<string, unknown>;
  metadata?: {
    source?: "ui" | "api" | "ai" | "workflow";
    workflowId?: string;
  };
};

export type BusinessActionResponse = {
  status: "success" | "error";
  eventId?: string;
  auditId?: string;
  aiDecision?: {
    reasoning?: string;
    confidenceScore?: number;
    riskLevel?: "low" | "medium" | "high";
  };
  result?: Record<string, unknown>;
  error?: { code: string; message: string };
};

export const BUSINESS_INTENTS: Array<{
  intent: BusinessIntent;
  label: string;
  description: string;
  engine: string;
}> = [
  {
    intent: "create_contact",
    label: "Create contact",
    description: "Add a CRM contact from business intent.",
    engine: "crm",
  },
  {
    intent: "create_task",
    label: "Create task",
    description: "Create a CRM task linked to a contact or deal.",
    engine: "crm",
  },
  {
    intent: "create_invoice",
    label: "Create invoice",
    description: "Generate a finance invoice and post to ledger.",
    engine: "finance",
  },
  {
    intent: "post_journal_entry",
    label: "Post journal entry",
    description: "Double-entry journal posting with validation.",
    engine: "finance",
  },
  {
    intent: "generate_pl",
    label: "Generate P&L",
    description: "Profit & loss and balance sheet from ledger.",
    engine: "finance",
  },
  {
    intent: "reconcile_account",
    label: "Reconcile account",
    description: "Compare ledger balance to expected for an account.",
    engine: "finance",
  },
  {
    intent: "run_payroll",
    label: "Run payroll",
    description: "UK monthly PAYE/NI payroll run with payslips.",
    engine: "payroll",
  },
  {
    intent: "generate_payslip",
    label: "Generate payslip",
    description: "Retrieve latest payslip for an employee.",
    engine: "payroll",
  },
  {
    intent: "analyze_contract",
    label: "Analyze contract",
    description: "Clause risk scan on contract text.",
    engine: "legal",
  },
  {
    intent: "generate_contract",
    label: "Generate contract",
    description: "Draft NDA, MSA, or employment contract from template.",
    engine: "legal",
  },
  {
    intent: "generate_hr_document",
    label: "Generate HR document",
    description: "AI-assisted HR policy or employment document.",
    engine: "hr",
  },
  {
    intent: "hire_employee",
    label: "Hire employee",
    description: "Add employee to HR roster with salary.",
    engine: "hr",
  },
  {
    intent: "start_workflow",
    label: "Start workflow",
    description: "AI-generate workflow from natural language intent.",
    engine: "workflow",
  },
  {
    intent: "get_industry_kpis",
    label: "Industry KPIs",
    description: "Industry-specific operational metrics.",
    engine: "industry",
  },
  {
    intent: "run_ai_buddy",
    label: "Run AI Buddy",
    description: "Execute a role-based AI buddy task via Intelligence Fabric.",
    engine: "intelligence_fabric",
  },
  {
    intent: "get_business_snapshot",
    label: "Business snapshot",
    description: "Founder dashboard pulse — revenue, pipeline, workforce.",
    engine: "intelligence_fabric",
  },
  {
    intent: "launch_business",
    label: "Launch business",
    description: "Start Launch OS business generation from an idea.",
    engine: "launch",
  },
];
