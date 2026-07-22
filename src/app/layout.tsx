import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const themeInitScript = `(function(){try{var t=localStorage.getItem("aarvanta-theme");document.documentElement.classList.remove("dark","light");document.documentElement.classList.add(t==="light"?"light":"dark");}catch(e){document.documentElement.classList.add("dark");}})();`;

/** Set googtrans before Google Translate script boots so the first paint is already localized */
const languageInitScript = `(function(){try{var lang=localStorage.getItem("aarvanta-language")||"en";var expire="Thu, 01 Jan 1970 00:00:00 GMT";var host=location.hostname;var domains=["",host,"."+host];if(host.indexOf(".")!==-1){var p=host.split(".");if(p.length>2)domains.push("."+p.slice(-2).join("."));}var parts=document.cookie.split(";");for(var i=0;i<parts.length;i++){var name=parts[i].split("=")[0].trim();if(!name||name.toLowerCase().indexOf("googtrans")===-1)continue;for(var d=0;d<domains.length;d++){var dp=domains[d]?";domain="+domains[d]:"";document.cookie=name+"=;expires="+expire+";path=/"+dp;document.cookie=name+"=;Max-Age=0;path=/"+dp;}}if(location.hash&&/googtrans/i.test(location.hash)){history.replaceState(null,"",location.pathname+location.search);}if(lang&&lang!=="en"){document.cookie="googtrans=/en/"+lang+";path=/;max-age=31536000;SameSite=Lax";document.documentElement.lang=lang.indexOf("zh")===0?lang:lang.split("-")[0];}else{document.documentElement.lang="en";}}catch(e){}})();`;

/** Kill the Google Translate top bar as soon as it appears (before React hydrates) */
const hideTranslateBannerScript = `(function(){function hide(){try{document.querySelectorAll("iframe.goog-te-banner-frame,.goog-te-banner-frame,iframe.skiptranslate,.goog-te-menu-frame,#goog-gt-tt,.VIpgJd-ZVi9od-ORHb-OEYmcd,.VIpgJd-yAWNEb-L7lbkb").forEach(function(el){if(el.closest&&el.closest("#google_translate_element"))return;el.style.setProperty("display","none","important");el.style.setProperty("visibility","hidden","important");el.style.setProperty("height","0","important");el.style.setProperty("opacity","0","important");});if(document.body){document.body.style.setProperty("top","0","important");document.body.style.setProperty("position","static","important");var kids=document.body.children;for(var i=0;i<kids.length;i++){var c=kids[i];if(c.id==="google_translate_element")continue;if(c.classList&&c.classList.contains("skiptranslate")){c.style.setProperty("display","none","important");c.style.setProperty("visibility","hidden","important");c.style.setProperty("height","0","important");}}}}catch(e){}}hide();document.addEventListener("DOMContentLoaded",hide);var obs=new MutationObserver(hide);obs.observe(document.documentElement,{childList:true,subtree:true});setInterval(hide,800);})();`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Aarvanta Business OS — Hire Your First AI Workforce",
    template: "%s | Aarvanta Business OS",
  },
  description:
    "Run sales, marketing, operations and customer support from one dashboard. CRM, projects, AI employees, and automation for SMEs.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: hideTranslateBannerScript }} />
      </head>
      <body className="h-full min-h-full overflow-x-hidden bg-background text-foreground antialiased">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
