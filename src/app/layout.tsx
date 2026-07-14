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
const languageInitScript = `(function(){try{var lang=localStorage.getItem("aarvanta-language")||"en";var expire="Thu, 01 Jan 1970 00:00:00 GMT";document.cookie="googtrans=;expires="+expire+";path=/";if(lang&&lang!=="en"){document.cookie="googtrans=/en/"+lang+";path=/";document.documentElement.lang=lang.indexOf("zh")===0?lang:lang.split("-")[0];}else{document.documentElement.lang="en";}}catch(e){}})();`;

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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
      </head>
      <body className="h-full min-h-full overflow-x-hidden bg-background text-foreground antialiased">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
