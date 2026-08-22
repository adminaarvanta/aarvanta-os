/** Free Google Translate covers 200+ languages without maintaining translation files. */

export type AppLanguage = {
  code: string;
  name: string;
  nativeName: string;
};

/**
 * Full Cloud Translation / Google Translate language set.
 * Website-widget codes (`googtrans=/en/{code}`) — aliases mapped in
 * `googleTranslateTargetCode`.
 */
export const APP_LANGUAGES: AppLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ab", name: "Abkhaz", nativeName: "Аҧсуа" },
  { code: "ace", name: "Acehnese", nativeName: "Aceh" },
  { code: "ach", name: "Acholi", nativeName: "Acholi" },
  { code: "aa", name: "Afar", nativeName: "Afar" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "sq", name: "Albanian", nativeName: "Shqip" },
  { code: "alz", name: "Alur", nativeName: "Alur" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "av", name: "Avar", nativeName: "Авар" },
  { code: "awa", name: "Awadhi", nativeName: "अवधी" },
  { code: "ay", name: "Aymara", nativeName: "Aymar aru" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan" },
  { code: "ban", name: "Balinese", nativeName: "Basa Bali" },
  { code: "bal", name: "Baluchi", nativeName: "بلوچی" },
  { code: "bm", name: "Bambara", nativeName: "Bamanankan" },
  { code: "ba", name: "Bashkir", nativeName: "Башҡортса" },
  { code: "eu", name: "Basque", nativeName: "Euskara" },
  { code: "btx", name: "Batak Karo", nativeName: "Batak Karo" },
  { code: "bts", name: "Batak Simalungun", nativeName: "Batak Simalungun" },
  { code: "bbc", name: "Batak Toba", nativeName: "Batak Toba" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская" },
  { code: "bem", name: "Bemba", nativeName: "Ichibemba" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "bew", name: "Betawi", nativeName: "Betawi" },
  { code: "bho", name: "Bhojpuri", nativeName: "भोजपुरी" },
  { code: "bik", name: "Bikol", nativeName: "Bikol" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski" },
  { code: "br", name: "Breton", nativeName: "Brezhoneg" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "bua", name: "Buryat", nativeName: "Буряад" },
  { code: "yue", name: "Cantonese", nativeName: "粵語" },
  { code: "ca", name: "Catalan", nativeName: "Català" },
  { code: "ceb", name: "Cebuano", nativeName: "Cebuano" },
  { code: "ch", name: "Chamorro", nativeName: "Chamoru" },
  { code: "ce", name: "Chechen", nativeName: "Нохчийн" },
  { code: "ny", name: "Chichewa", nativeName: "Chichewa" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "chk", name: "Chuukese", nativeName: "Chuukese" },
  { code: "cv", name: "Chuvash", nativeName: "Чӑваш" },
  { code: "co", name: "Corsican", nativeName: "Corsu" },
  { code: "crh", name: "Crimean Tatar", nativeName: "Qırımtatarca" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "prs", name: "Dari", nativeName: "دری" },
  { code: "din", name: "Dinka", nativeName: "Thuɔŋjäŋ" },
  { code: "dv", name: "Divehi", nativeName: "ދިވެހި" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "dyu", name: "Dyula", nativeName: "Julakan" },
  { code: "dz", name: "Dzongkha", nativeName: "རྫོང་ཁ" },
  { code: "eo", name: "Esperanto", nativeName: "Esperanto" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "ee", name: "Ewe", nativeName: "Eʋegbe" },
  { code: "fo", name: "Faroese", nativeName: "Føroyskt" },
  { code: "fj", name: "Fijian", nativeName: "Na Vosa Vakaviti" },
  { code: "fil", name: "Filipino", nativeName: "Filipino" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "fon", name: "Fon", nativeName: "Fon" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "fy", name: "Frisian", nativeName: "Frysk" },
  { code: "fur", name: "Friulian", nativeName: "Furlan" },
  { code: "ff", name: "Fulani", nativeName: "Fulfulde" },
  { code: "gaa", name: "Ga", nativeName: "Ga" },
  { code: "gl", name: "Galician", nativeName: "Galego" },
  { code: "lg", name: "Ganda", nativeName: "Luganda" },
  { code: "ka", name: "Georgian", nativeName: "ქართული" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "gn", name: "Guarani", nativeName: "Avañe'ẽ" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl ayisyen" },
  { code: "cnh", name: "Hakha Chin", nativeName: "Lai holh" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "haw", name: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "hil", name: "Hiligaynon", nativeName: "Hiligaynon" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "hmn", name: "Hmong", nativeName: "Hmong" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "hrx", name: "Hunsrik", nativeName: "Hunsrik" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska" },
  { code: "ig", name: "Igbo", nativeName: "Igbo" },
  { code: "ilo", name: "Ilocano", nativeName: "Ilokano" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa" },
  { code: "kl", name: "Kalaallisut", nativeName: "Kalaallisut" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "pam", name: "Kapampangan", nativeName: "Kapampangan" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ" },
  { code: "kha", name: "Khasi", nativeName: "Khasi" },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ" },
  { code: "cgg", name: "Kiga", nativeName: "Rukiga" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Kinyarwanda" },
  { code: "ktu", name: "Kituba", nativeName: "Kituba" },
  { code: "gom", name: "Konkani", nativeName: "कोंकणी" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "kri", name: "Krio", nativeName: "Krio" },
  { code: "ku", name: "Kurdish (Kurmanji)", nativeName: "Kurdî" },
  { code: "ckb", name: "Kurdish (Sorani)", nativeName: "سۆرانی" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча" },
  { code: "lo", name: "Lao", nativeName: "ລາວ" },
  { code: "ltg", name: "Latgalian", nativeName: "Latgalīšu" },
  { code: "la", name: "Latin", nativeName: "Latina" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "lij", name: "Ligurian", nativeName: "Ligure" },
  { code: "li", name: "Limburgish", nativeName: "Limburgs" },
  { code: "ln", name: "Lingala", nativeName: "Lingála" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lmo", name: "Lombard", nativeName: "Lombard" },
  { code: "luo", name: "Luo", nativeName: "Dholuo" },
  { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली" },
  { code: "mak", name: "Makassar", nativeName: "Basa Mangkasara" },
  { code: "mg", name: "Malagasy", nativeName: "Malagasy" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mt", name: "Maltese", nativeName: "Malti" },
  { code: "mam", name: "Mam", nativeName: "Mam" },
  { code: "gv", name: "Manx", nativeName: "Gaelg" },
  { code: "mi", name: "Maori", nativeName: "Māori" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "chm", name: "Meadow Mari", nativeName: "Олык марий" },
  { code: "mni-Mtei", name: "Meiteilon (Manipuri)", nativeName: "ꯃꯤꯇꯩꯂꯣꯟ" },
  { code: "min", name: "Minangkabau", nativeName: "Baso Minang" },
  { code: "lus", name: "Mizo", nativeName: "Mizo ṭawng" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол" },
  { code: "my", name: "Myanmar (Burmese)", nativeName: "မြန်မာ" },
  { code: "nhe", name: "Nahuatl (Eastern Huasteca)", nativeName: "Nahuatl" },
  { code: "ndc-ZW", name: "Ndau", nativeName: "Ndau" },
  { code: "nr", name: "Ndebele (South)", nativeName: "isiNdebele" },
  { code: "new", name: "Nepalbhasa (Newari)", nativeName: "नेपाल भाषा" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "nso", name: "Northern Sotho (Sepedi)", nativeName: "Sepedi" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "nus", name: "Nuer", nativeName: "Thok Naath" },
  { code: "oc", name: "Occitan", nativeName: "Occitan" },
  { code: "or", name: "Odia (Oriya)", nativeName: "ଓଡ଼ିଆ" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo" },
  { code: "os", name: "Ossetian", nativeName: "Ирон" },
  { code: "pag", name: "Pangasinan", nativeName: "Pangasinan" },
  { code: "pap", name: "Papiamento", nativeName: "Papiamentu" },
  { code: "ps", name: "Pashto", nativeName: "پښتو" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)", nativeName: "Português (Portugal)" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "qu", name: "Quechua", nativeName: "Runasimi" },
  { code: "rom", name: "Romani", nativeName: "Romani" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "rn", name: "Rundi", nativeName: "Ikirundi" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "sm", name: "Samoan", nativeName: "Gagana Samoa" },
  { code: "sg", name: "Sango", nativeName: "Sängö" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "sat-Latn", name: "Santali", nativeName: "Santali" },
  { code: "gd", name: "Scottish Gaelic", nativeName: "Gàidhlig" },
  { code: "sr", name: "Serbian", nativeName: "Српски" },
  { code: "st", name: "Sesotho", nativeName: "Sesotho" },
  { code: "crs", name: "Seychellois Creole", nativeName: "Seselwa" },
  { code: "shn", name: "Shan", nativeName: "လိၵ်ႈတႆး" },
  { code: "sn", name: "Shona", nativeName: "ChiShona" },
  { code: "scn", name: "Sicilian", nativeName: "Sicilianu" },
  { code: "szl", name: "Silesian", nativeName: "Ślōnskŏ" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "so", name: "Somali", nativeName: "Soomaali" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "su", name: "Sundanese", nativeName: "Basa Sunda" },
  { code: "sus", name: "Susu", nativeName: "Sosoxui" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "ss", name: "Swati", nativeName: "siSwati" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "tt", name: "Tatar", nativeName: "Татар" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "tet", name: "Tetum", nativeName: "Tetun" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "bo", name: "Tibetan", nativeName: "བོད་སྐད་" },
  { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ" },
  { code: "tpi", name: "Tok Pisin", nativeName: "Tok Pisin" },
  { code: "to", name: "Tongan", nativeName: "Lea fakatonga" },
  { code: "ts", name: "Tsonga", nativeName: "Xitsonga" },
  { code: "tn", name: "Tswana", nativeName: "Setswana" },
  { code: "tcy", name: "Tulu", nativeName: "ತುಳು" },
  { code: "tum", name: "Tumbuka", nativeName: "chiTumbuka" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "tk", name: "Turkmen", nativeName: "Türkmen" },
  { code: "ak", name: "Twi (Akan)", nativeName: "Twi" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "ug", name: "Uyghur", nativeName: "ئۇيغۇرچە" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbek" },
  { code: "ve", name: "Venda", nativeName: "Tshivenḓa" },
  { code: "vec", name: "Venetian", nativeName: "Vèneto" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "war", name: "Waray", nativeName: "Winaray" },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
  { code: "wo", name: "Wolof", nativeName: "Wolof" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "sah", name: "Yakut", nativeName: "Саха тыла" },
  { code: "yi", name: "Yiddish", nativeName: "ייִדיש" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "yua", name: "Yucatec Maya", nativeName: "Màaya t'aan" },
  { code: "zap", name: "Zapotec", nativeName: "Diidxazá" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
];

export const LANGUAGE_STORAGE_KEY = "aarvanta-language";
export const SOURCE_LANGUAGE = "en";

/** Widget codes that differ from the ISO codes we store. */
const GOOGLE_TRANSLATE_CODE_ALIASES: Record<string, string> = {
  he: "iw",
  jv: "jw",
  fil: "tl",
};

export function googleTranslateTargetCode(code: string) {
  return GOOGLE_TRANSLATE_CODE_ALIASES[code] ?? code;
}

export const GOOGLE_TRANSLATE_INCLUDED_LANGUAGES = Array.from(
  new Set(APP_LANGUAGES.map((l) => googleTranslateTargetCode(l.code)))
).join(",");

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
  const normalized = code === "iw" ? "he" : code === "jw" ? "jv" : code;
  return APP_LANGUAGES.find((l) => l.code === normalized || l.code === code);
}

export function clearGoogTransCookies() {
  if (typeof document === "undefined") return;

  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  const hostname = window.location.hostname;
  const domains = ["", hostname, `.${hostname}`];
  if (hostname.includes(".")) {
    const parts = hostname.split(".");
    if (parts.length > 2) {
      domains.push(`.${parts.slice(-2).join(".")}`);
    }
  }

  const paths = ["/", window.location.pathname || "/"];
  const names = new Set<string>(["googtrans"]);

  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && /googtrans/i.test(name)) names.add(name);
  }

  for (const name of names) {
    for (const path of paths) {
      for (const domain of domains) {
        const domainPart = domain ? `;domain=${domain}` : "";
        document.cookie = `${name}=;expires=${expire};path=${path}${domainPart}`;
        document.cookie = `${name}=;Max-Age=0;path=${path}${domainPart}`;
      }
    }
  }

  if (window.location.hash && /googtrans/i.test(window.location.hash)) {
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }
}

/**
 * Set exactly one host-only googtrans cookie (no Domain=).
 * Multiple domain-scoped cookies caused sticky first-language bugs (e.g. Hindi).
 */
export function setGoogTransCookie(lang: string) {
  clearGoogTransCookies();

  if (!lang || lang === SOURCE_LANGUAGE) return;

  const target = googleTranslateTargetCode(lang);
  document.cookie = `googtrans=/en/${target};path=/;max-age=31536000;SameSite=Lax`;
}

/** Persist preference + cookie, then hard-navigate (avoids BFCache / stale GT session). */
export function persistAndNavigateToLanguage(code: string) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }

  clearGoogTransCookies();
  if (code && code !== SOURCE_LANGUAGE) {
    const target = googleTranslateTargetCode(code);
    document.cookie = `googtrans=/en/${target};path=/;max-age=31536000;SameSite=Lax`;
  }

  if (window.location.hash) {
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }

  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.set("_lang", code);
  url.searchParams.set("_t", String(Date.now()));
  window.location.assign(url.toString());
}

export function readStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || SOURCE_LANGUAGE;
  } catch {
    return SOURCE_LANGUAGE;
  }
}

/** Drop cache-bust params from the URL after boot (no reload). */
export function stripLanguageNavParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("_lang") && !url.searchParams.has("_t")) return;
  url.searchParams.delete("_lang");
  url.searchParams.delete("_t");
  history.replaceState(null, "", url.pathname + url.search + url.hash);
}
