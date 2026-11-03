import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { getPublishedOrigin } from "@/lib/seo";
import { SiteHeader } from "@/components/site-header";
import { MobileCallBar, SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getPublishedOrigin() ?? "http://localhost:3000"),
  title: { default: site.business.name, template: "%s" },
  description:
    "Licensed paralegal services in Scarborough, Toronto. Find a clearer next step for your legal matter.",
  robots: { index: false, follow: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-CA">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <MobileCallBar />
      </body>
    </html>
  );
}
