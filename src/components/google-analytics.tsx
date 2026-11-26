"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (previousPath.current === pathname) {
      return;
    }

    window.dataLayer ??= [];

    if (!window.gtag) {
      window.gtag = function () {
        // The Google tag expects an arguments object in its command queue.
        // eslint-disable-next-line prefer-rest-params -- Match the Google tag queue API.
        window.dataLayer!.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }

    previousPath.current = pathname;

    // Let Next update the document title before recording a client-side visit.
    const frame = requestAnimationFrame(() => {
      window.gtag?.("event", "page_view", {
        page_title: document.title,
        page_location: `${window.location.origin}${pathname}`,
        page_referrer: "",
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      previousPath.current = null;
    };
  }, [measurementId, pathname]);

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  );
}
