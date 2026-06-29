import type { HrDocumentType } from "@/types/platform-modules";

export type HrDocumentField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
};

export type HrDocumentSpec = {
  type: HrDocumentType;
  label: string;
  description: string;
  fields: HrDocumentField[];
};

export const HR_DOCUMENT_SPECS: HrDocumentSpec[] = [
  {
    type: "offer_letter",
    label: "Offer letter",
    description: "Formal job offer with role, compensation, and start date.",
    fields: [
      { key: "jobTitle", label: "Job title", required: true },
      { key: "department", label: "Department", required: true },
      { key: "startDate", label: "Start date", placeholder: "e.g. 1 July 2026", required: true },
      { key: "salary", label: "Annual salary", placeholder: "e.g. £65,000", required: true },
      { key: "reportingTo", label: "Reports to" },
      { key: "workLocation", label: "Work location", placeholder: "Hybrid / London" },
    ],
  },
  {
    type: "experience_letter",
    label: "Experience letter",
    description: "Certificate of employment for past or current staff.",
    fields: [
      { key: "jobTitle", label: "Job title", required: true },
      { key: "department", label: "Department", required: true },
      { key: "employmentFrom", label: "Employment from", required: true },
      { key: "employmentTo", label: "Employment to", placeholder: "Present or date" },
      { key: "responsibilities", label: "Key responsibilities" },
    ],
  },
  {
    type: "appointment_letter",
    label: "Appointment letter",
    description: "Confirms appointment to a role after acceptance.",
    fields: [
      { key: "jobTitle", label: "Job title", required: true },
      { key: "effectiveDate", label: "Effective date", required: true },
      { key: "probationPeriod", label: "Probation period", placeholder: "3 months" },
    ],
  },
  {
    type: "relieving_letter",
    label: "Relieving / experience release",
    description: "Confirms exit, last working day, and clearance.",
    fields: [
      { key: "lastWorkingDay", label: "Last working day", required: true },
      { key: "reason", label: "Reason for exit", placeholder: "Resignation / mutual separation" },
    ],
  },
  {
    type: "salary_certificate",
    label: "Salary certificate",
    description: "Proof of compensation for banks or visas.",
    fields: [
      { key: "jobTitle", label: "Job title", required: true },
      { key: "annualSalary", label: "Annual salary", required: true },
      { key: "payFrequency", label: "Pay frequency", placeholder: "Monthly" },
    ],
  },
  {
    type: "employment_verification",
    label: "Employment verification",
    description: "Short letter confirming active employment.",
    fields: [
      { key: "jobTitle", label: "Job title", required: true },
      { key: "employmentStart", label: "Employment start", required: true },
      { key: "purpose", label: "Purpose", placeholder: "Mortgage application" },
    ],
  },
  {
    type: "corporate_invoice",
    label: "Corporate invoice",
    description: "Professional invoice for services, retainers, or reimbursements.",
    fields: [
      { key: "invoiceNumber", label: "Invoice number", placeholder: "INV-2026-001" },
      { key: "billTo", label: "Bill to", required: true },
      { key: "lineItems", label: "Line items", placeholder: "Consulting — 40 hrs @ £120", required: true },
      { key: "dueDate", label: "Due date", required: true },
      { key: "paymentTerms", label: "Payment terms", placeholder: "Net 30" },
    ],
  },
  {
    type: "nda",
    label: "NDA / confidentiality",
    description: "Mutual or one-way non-disclosure agreement.",
    fields: [
      { key: "counterparty", label: "Counterparty name", required: true },
      { key: "purpose", label: "Purpose of disclosure", required: true },
      { key: "termYears", label: "Term (years)", placeholder: "2" },
    ],
  },
  {
    type: "policy_memo",
    label: "HR policy memo",
    description: "Internal policy update or HR announcement.",
    fields: [
      { key: "policyTopic", label: "Policy topic", required: true },
      { key: "effectiveDate", label: "Effective date", required: true },
      { key: "audience", label: "Audience", placeholder: "All employees" },
    ],
  },
  {
    type: "warning_letter",
    label: "Warning / disciplinary letter",
    description: "Formal warning with facts, expectations, and review date.",
    fields: [
      { key: "incidentDate", label: "Incident date", required: true },
      { key: "issueSummary", label: "Issue summary", required: true },
      { key: "expectedImprovement", label: "Expected improvement", required: true },
      { key: "reviewDate", label: "Review date" },
    ],
  },
  {
    type: "custom_corporate",
    label: "Custom corporate document",
    description: "Any HR or corporate letter — describe what you need.",
    fields: [
      { key: "documentPurpose", label: "Document purpose", required: true },
    ],
  },
];

export function getHrDocumentSpec(type: HrDocumentType): HrDocumentSpec {
  return (
    HR_DOCUMENT_SPECS.find((spec) => spec.type === type) ??
    HR_DOCUMENT_SPECS[HR_DOCUMENT_SPECS.length - 1]
  );
}

export function labelForHrDocumentType(type: HrDocumentType): string {
  return getHrDocumentSpec(type).label;
}
