import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nunito } from "next/font/google";
import { Suspense } from "react";
import { DisclaimerBar } from "@/components/disclaimer-bar";
import { InstallPrompt } from "@/components/install-prompt";
import { PwaRegister } from "@/components/pwa-register";
import { MobileNav } from "@/components/site-chrome";
import { SiteFooter } from "@/components/site-footer";
import { HeaderSlot } from "@/components/site-header";
import "./globals.css";

const sans = Nunito({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hearth — the open desk for home coverage",
    template: "%s · Hearth",
  },
  description:
    "A prototype marketplace where homeowners post the coverage they need and underwriters bid the annual premium. Bids price the risk. No policy is sold.",
  applicationName: "Hearth",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hearth",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#E1063A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-card focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <DisclaimerBar />
        <HeaderSlot />
        <main id="main" className="flex-1 pb-40 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <InstallPrompt />
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        <PwaRegister />
      </body>
    </html>
  );
}
