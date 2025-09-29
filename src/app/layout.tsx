import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/components/providers/auth-provider";

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e293b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground touch-action-manipulation`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
