/** Canonical company defaults for Launch OS, AGEB, finance, and HR. */
export const COMPANY_PROFILE = {
  legalName: "AARVANTA LIMITED",
  displayName: "Aarvanta",
  countryCode: "GB",
  currency: "GBP",
  currencySymbol: "£",
  hrApproverEmail: "hr@aarvanta.co",
  defaultIndustryProfileId: "professional_services",
} as const;

export function getCompanyLegalName(): string {
  return process.env.ORGANIZATION_NAME?.trim() || COMPANY_PROFILE.legalName;
}

export function getHrApproverEmail(): string {
  return process.env.HR_APPROVER_EMAIL?.trim() || COMPANY_PROFILE.hrApproverEmail;
}
