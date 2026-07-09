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
    default: "Aarvanta Business OS — Hire Your First AI Workforce",
    template: "%s | Aarvanta Business OS",
  },
  description:
    "Run sales, marketing, operations and customer support from one dashboard. CRM, projects, AI employees, and automation for SMEs.",
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
      <body className="h-full min-h-full overflow-x-hidden bg-black text-white antialiased">{children}</body>
    </html>
  );
}
