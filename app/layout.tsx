import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Calendar CRM - Modern Calendar & Contact Management",
    template: "%s | Calendar CRM",
  },
  description:
    "Professionell CRM-lösning med kalender, kontakthantering, fastigheter och AI-assistent. Byggd med Next.js 15, TypeScript och Supabase.",
  keywords: [
    "CRM",
    "Calendar",
    "Contact Management",
    "Real Estate CRM",
    "Task Management",
    "AI Assistant",
    "VAPI Integration",
    "Multi-tenant",
    "Supabase",
    "Next.js",
  ],
  authors: [{ name: "Calendar CRM Team" }],
  creator: "Calendar CRM Team",
  publisher: "Calendar CRM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "/",
    title: "Calendar CRM - Modern Calendar & Contact Management",
    description:
      "Professionell CRM-lösning med kalender, kontakthantering, fastigheter och AI-assistent.",
    siteName: "Calendar CRM",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendar CRM - Modern Calendar & Contact Management",
    description:
      "Professionell CRM-lösning med kalender, kontakthantering, fastigheter och AI-assistent.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
