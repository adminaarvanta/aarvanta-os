import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Aarvanta OS — AI Workforce & Business Operating System",
    template: "%s | Aarvanta OS",
  },
  description:
    "AI employees, CRM, knowledge hub, projects, and unified inbox — one platform for modern SMEs.",
  icons: {
    icon: "/aarvanta-logo.png",
    apple: "/aarvanta-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`}>
      <body className="min-h-full bg-black text-[#F5E6C8] antialiased">{children}</body>
    </html>
  );
}
