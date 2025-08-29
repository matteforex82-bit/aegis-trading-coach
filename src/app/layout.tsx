import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROP CONTROL - Trading Dashboard",
  description: "Professional PropFirm trading dashboard with MT5 integration, risk management, and performance analytics.",
  keywords: ["PropFirm", "Trading", "MT5", "Risk Management", "Trading Dashboard", "Performance Analytics"],
  authors: [{ name: "PROP CONTROL Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.svg', sizes: '32x32', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg'
  },
  openGraph: {
    title: "PROP CONTROL - Trading Dashboard",
    description: "Professional PropFirm trading dashboard with MT5 integration",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PROP CONTROL - Trading Dashboard",
    description: "Professional PropFirm trading dashboard with MT5 integration",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground touch-action-manipulation`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
