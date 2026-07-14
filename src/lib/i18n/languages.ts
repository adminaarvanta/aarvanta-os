/** Free Google Translate covers 100+ languages without maintaining translation files. */

export type AppLanguage = {
  code: string;
  name: string;
  nativeName: string;
};

/** Full Google Translate language set commonly supported in the free website translator */
export const APP_LANGUAGES: AppLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "sq", name: "Albanian", nativeName: "Shqip" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan" },
  { code: "eu", name: "Basque", nativeName: "Euskara" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "ca", name: "Catalan", nativeName: "Català" },
  { code: "ceb", name: "Cebuano", nativeName: "Cebuano" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "co", name: "Corsican", nativeName: "Corsu" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "eo", name: "Esperanto", nativeName: "Esperanto" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "fy", name: "Frisian", nativeName: "Frysk" },
  { code: "gl", name: "Galician", nativeName: "Galego" },
  { code: "ka", name: "Georgian", nativeName: "ქართული" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl ayisyen" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "haw", name: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "hmn", name: "Hmong", nativeName: "Hmong" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska" },
  { code: "ig", name: "Igbo", nativeName: "Igbo" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ" },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Kinyarwanda" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ku", name: "Kurdish", nativeName: "Kurdî" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча" },
  { code: "lo", name: "Lao", nativeName: "ລາວ" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски" },
  { code: "mg", name: "Malagasy", nativeName: "Malagasy" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mt", name: "Maltese", nativeName: "Malti" },
  { code: "mi", name: "Maori", nativeName: "Māori" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол" },
  { code: "my", name: "Myanmar", nativeName: "မြန်မာ" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "ny", name: "Nyanja", nativeName: "Chichewa" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ps", name: "Pashto", nativeName: "پښتو" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "sm", name: "Samoan", nativeName: "Gagana Samoa" },
  { code: "gd", name: "Scottish Gaelic", nativeName: "Gàidhlig" },
  { code: "sr", name: "Serbian", nativeName: "Српски" },
  { code: "st", name: "Sesotho", nativeName: "Sesotho" },
  { code: "sn", name: "Shona", nativeName: "ChiShona" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "so", name: "Somali", nativeName: "Soomaali" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "su", name: "Sundanese", nativeName: "Basa Sunda" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "tt", name: "Tatar", nativeName: "Татар" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "tk", name: "Turkmen", nativeName: "Türkmen" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "ug", name: "Uyghur", nativeName: "ئۇيغۇرچە" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbek" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "yi", name: "Yiddish", nativeName: "ייִדיש" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
];

export const LANGUAGE_STORAGE_KEY = "aarvanta-language";
export const SOURCE_LANGUAGE = "en";

export const POPULAR_LANGUAGE_CODES = [
  "en",
  "hi",
  "es",
  "fr",
  "de",
  "ar",
  "zh-CN",
  "pt",
  "ja",
  "ko",
  "it",
  "ru",
  "bn",
  "ur",
  "ta",
  "te",
  "mr",
  "gu",
  "kn",
  "ml",
  "pa",
  "tr",
  "vi",
  "id",
  "th",
  "nl",
  "pl",
];

export function languageByCode(code: string) {
  return APP_LANGUAGES.find((l) => l.code === code);
}

export function setGoogTransCookie(lang: string) {
  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  const hosts = [
    "",
    window.location.hostname,
    `.${window.location.hostname}`,
  ];

  for (const domain of hosts) {
    const domainPart = domain ? `;domain=${domain}` : "";
    // Clear any previous value first
    document.cookie = `googtrans=;expires=${expire};path=/${domainPart}`;
    document.cookie = `googtrans=/;expires=${expire};path=/${domainPart}`;
  }

  if (lang === SOURCE_LANGUAGE) return;

  const value = `/en/${lang}`;
  for (const domain of hosts) {
    const domainPart = domain ? `;domain=${domain}` : "";
    document.cookie = `googtrans=${value};path=/${domainPart}`;
    document.cookie = `googtrans=${value};path=/;Secure;SameSite=Lax${domainPart}`;
  }
}

export function readStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || SOURCE_LANGUAGE;
  } catch {
    return SOURCE_LANGUAGE;
  }
}
