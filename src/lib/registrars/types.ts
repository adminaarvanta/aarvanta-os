/** Registrant contact used for WHOIS / registry contact_set. */
export type DomainRegistrantContact = {
  firstName: string;
  lastName: string;
  orgName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type DomainAvailabilityResult = {
  domain: string;
  available: boolean;
  /** Wholesale price in USD when the registrar returns one. */
  wholesalePriceUsd?: number;
  isPremium?: boolean;
  reason?: string;
};

export type DomainPriceResult = {
  domain: string;
  periodYears: number;
  wholesalePriceUsd: number;
  isPremium?: boolean;
};

export type RegisterDomainInput = {
  domain: string;
  years: number;
  autoRenew: boolean;
  contact: DomainRegistrantContact;
  /** OpenSRS registrant profile username (alphanumeric). */
  regUsername: string;
  /** OpenSRS registrant profile password. */
  regPassword: string;
  /** When set, verify premium list price on register. */
  premiumPriceUsd?: number;
};

export type RegisterDomainResult = {
  orderId: string;
  domain: string;
  responseCode: string;
  responseText: string;
  pending?: boolean;
};

/** Thin registrar surface used by Build OS domain search + Stripe fulfillment. */
export type DomainRegistrar = {
  readonly id: "opensrs" | "demo";
  checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]>;
  getPrice(domain: string, years?: number): Promise<DomainPriceResult>;
  registerDomain(input: RegisterDomainInput): Promise<RegisterDomainResult>;
};
