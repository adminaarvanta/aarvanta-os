/** Shared country, currency, locale, and timezone catalogs for global-ready UX. */

export type CountryOption = {
  name: string;
  code: string;
  regionCode: string;
  currency: string;
  locale: string;
  timezone: string;
};

export const COUNTRIES: CountryOption[] = [
  { name: "United Kingdom", code: "GB", regionCode: "uk", currency: "GBP", locale: "en-GB", timezone: "Europe/London" },
  { name: "United States", code: "US", regionCode: "usa", currency: "USD", locale: "en-US", timezone: "America/New_York" },
  { name: "India", code: "IN", regionCode: "india", currency: "INR", locale: "en-IN", timezone: "Asia/Kolkata" },
  { name: "Canada", code: "CA", regionCode: "usa", currency: "CAD", locale: "en-CA", timezone: "America/Toronto" },
  { name: "Australia", code: "AU", regionCode: "au", currency: "AUD", locale: "en-AU", timezone: "Australia/Sydney" },
  { name: "New Zealand", code: "NZ", regionCode: "au", currency: "NZD", locale: "en-NZ", timezone: "Pacific/Auckland" },
  { name: "Ireland", code: "IE", regionCode: "eu", currency: "EUR", locale: "en-IE", timezone: "Europe/Dublin" },
  { name: "Germany", code: "DE", regionCode: "eu", currency: "EUR", locale: "de-DE", timezone: "Europe/Berlin" },
  { name: "France", code: "FR", regionCode: "eu", currency: "EUR", locale: "fr-FR", timezone: "Europe/Paris" },
  { name: "Netherlands", code: "NL", regionCode: "eu", currency: "EUR", locale: "nl-NL", timezone: "Europe/Amsterdam" },
  { name: "Spain", code: "ES", regionCode: "eu", currency: "EUR", locale: "es-ES", timezone: "Europe/Madrid" },
  { name: "Italy", code: "IT", regionCode: "eu", currency: "EUR", locale: "it-IT", timezone: "Europe/Rome" },
  { name: "Portugal", code: "PT", regionCode: "eu", currency: "EUR", locale: "pt-PT", timezone: "Europe/Lisbon" },
  { name: "Sweden", code: "SE", regionCode: "eu", currency: "SEK", locale: "sv-SE", timezone: "Europe/Stockholm" },
  { name: "Norway", code: "NO", regionCode: "eu", currency: "NOK", locale: "nb-NO", timezone: "Europe/Oslo" },
  { name: "Denmark", code: "DK", regionCode: "eu", currency: "DKK", locale: "da-DK", timezone: "Europe/Copenhagen" },
  { name: "Switzerland", code: "CH", regionCode: "eu", currency: "CHF", locale: "de-CH", timezone: "Europe/Zurich" },
  { name: "Poland", code: "PL", regionCode: "eu", currency: "PLN", locale: "pl-PL", timezone: "Europe/Warsaw" },
  { name: "United Arab Emirates", code: "AE", regionCode: "global", currency: "AED", locale: "en-AE", timezone: "Asia/Dubai" },
  { name: "Saudi Arabia", code: "SA", regionCode: "global", currency: "SAR", locale: "ar-SA", timezone: "Asia/Riyadh" },
  { name: "Singapore", code: "SG", regionCode: "sg", currency: "SGD", locale: "en-SG", timezone: "Asia/Singapore" },
  { name: "Malaysia", code: "MY", regionCode: "sg", currency: "MYR", locale: "en-MY", timezone: "Asia/Kuala_Lumpur" },
  { name: "Indonesia", code: "ID", regionCode: "global", currency: "IDR", locale: "id-ID", timezone: "Asia/Jakarta" },
  { name: "Philippines", code: "PH", regionCode: "global", currency: "PHP", locale: "en-PH", timezone: "Asia/Manila" },
  { name: "Japan", code: "JP", regionCode: "global", currency: "JPY", locale: "ja-JP", timezone: "Asia/Tokyo" },
  { name: "South Korea", code: "KR", regionCode: "global", currency: "KRW", locale: "ko-KR", timezone: "Asia/Seoul" },
  { name: "China", code: "CN", regionCode: "global", currency: "CNY", locale: "zh-CN", timezone: "Asia/Shanghai" },
  { name: "Hong Kong", code: "HK", regionCode: "global", currency: "HKD", locale: "zh-HK", timezone: "Asia/Hong_Kong" },
  { name: "Taiwan", code: "TW", regionCode: "global", currency: "TWD", locale: "zh-TW", timezone: "Asia/Taipei" },
  { name: "Brazil", code: "BR", regionCode: "global", currency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo" },
  { name: "Mexico", code: "MX", regionCode: "usa", currency: "MXN", locale: "es-MX", timezone: "America/Mexico_City" },
  { name: "South Africa", code: "ZA", regionCode: "global", currency: "ZAR", locale: "en-ZA", timezone: "Africa/Johannesburg" },
  { name: "Nigeria", code: "NG", regionCode: "global", currency: "NGN", locale: "en-NG", timezone: "Africa/Lagos" },
  { name: "Kenya", code: "KE", regionCode: "global", currency: "KES", locale: "en-KE", timezone: "Africa/Nairobi" },
  { name: "Pakistan", code: "PK", regionCode: "india", currency: "PKR", locale: "en-PK", timezone: "Asia/Karachi" },
  { name: "Bangladesh", code: "BD", regionCode: "india", currency: "BDT", locale: "bn-BD", timezone: "Asia/Dhaka" },
  { name: "Sri Lanka", code: "LK", regionCode: "india", currency: "LKR", locale: "en-LK", timezone: "Asia/Colombo" },
  { name: "Israel", code: "IL", regionCode: "global", currency: "ILS", locale: "he-IL", timezone: "Asia/Jerusalem" },
  { name: "Turkey", code: "TR", regionCode: "global", currency: "TRY", locale: "tr-TR", timezone: "Europe/Istanbul" },
  { name: "Other", code: "XX", regionCode: "global", currency: "USD", locale: "en-GB", timezone: "UTC" },
];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

export const CURRENCIES = [
  "GBP",
  "USD",
  "EUR",
  "INR",
  "CAD",
  "AUD",
  "NZD",
  "SGD",
  "AED",
  "JPY",
  "CHF",
  "ZAR",
] as const;

export const DATE_FORMATS = [
  { id: "day_month_year", label: "31/12/2026", example: "31/12/2026" },
  { id: "month_day_year", label: "12/31/2026", example: "12/31/2026" },
  { id: "year_month_day", label: "2026-12-31", example: "2026-12-31" },
] as const;

export const TIME_FORMATS = [
  { id: "24h", label: "24-hour (14:30)" },
  { id: "12h", label: "12-hour (2:30 PM)" },
] as const;

export const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Africa/Johannesburg",
  "Africa/Lagos",
] as const;

export const LOCALES = [
  { id: "en-GB", label: "English (UK)" },
  { id: "en-US", label: "English (US)" },
  { id: "en-IN", label: "English (India)" },
  { id: "en-AU", label: "English (Australia)" },
  { id: "hi-IN", label: "Hindi" },
  { id: "es-ES", label: "Spanish" },
  { id: "fr-FR", label: "French" },
  { id: "de-DE", label: "German" },
  { id: "pt-BR", label: "Portuguese (Brazil)" },
  { id: "ar-SA", label: "Arabic" },
  { id: "zh-CN", label: "Chinese (Simplified)" },
  { id: "ja-JP", label: "Japanese" },
] as const;

export type DateFormatId = (typeof DATE_FORMATS)[number]["id"];
export type TimeFormatId = (typeof TIME_FORMATS)[number]["id"];

export function countryByName(name: string): CountryOption | undefined {
  const key = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === key);
}

export function regionCodeForCountry(country: string): string {
  return countryByName(country)?.regionCode ?? "global";
}

export function defaultsForCountry(country: string): Pick<
  CountryOption,
  "currency" | "locale" | "timezone" | "code" | "regionCode"
> {
  const match = countryByName(country);
  if (match) {
    return {
      currency: match.currency,
      locale: match.locale,
      timezone: match.timezone,
      code: match.code,
      regionCode: match.regionCode,
    };
  }
  return {
    currency: "GBP",
    locale: "en-GB",
    timezone: "Europe/London",
    code: "GB",
    regionCode: "global",
  };
}

export function formatMoneyForLocale(
  amount: number,
  currency: string,
  locale = "en-GB"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDateForPrefs(
  value: string | Date,
  locale = "en-GB",
  dateFormat: DateFormatId = "day_month_year",
  timeFormat: TimeFormatId = "24h"
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const datePart =
    dateFormat === "month_day_year"
      ? `${month}/${day}/${year}`
      : dateFormat === "year_month_day"
        ? `${year}-${month}-${day}`
        : `${day}/${month}/${year}`;

  try {
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: timeFormat === "12h",
    }).format(date);
    return `${datePart} ${timePart}`;
  } catch {
    return datePart;
  }
}
