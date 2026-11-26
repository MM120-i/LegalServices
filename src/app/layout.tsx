import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { getPublishedOrigin, isPublished } from "@/lib/seo";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";
import "./legal-elegance.css";

export const metadata: Metadata = {
  metadataBase: new URL(getPublishedOrigin() ?? "http://localhost:3000"),
  title: { default: site.business.name, template: "%s" },
  description:
    "Licensed paralegal services in Scarborough, Toronto. Find a clearer next step for your legal matter.",
  robots: { index: isPublished(), follow: isPublished() },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

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
        {/^G-[A-Z0-9]+$/.test(measurementId) ? (
          <GoogleAnalytics measurementId={measurementId} />
        ) : null}
      </body>
    </html>
  );
}
