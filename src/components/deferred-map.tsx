"use client";

import { site } from "@/config/site";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function DeferredMap({ src, children }: { src: string; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    if (frame.current) {
      observer.observe(frame.current);
    }

    return () => observer.disconnect();
  }, []);

  const map = (
    <iframe
      src={src}
      loading="lazy"
      title={`Map — Abead Legal Services, ${site.address.street}, ${site.address.city}`}
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );

  return (
    <div ref={frame} className="map-frame">
      {visible ? map : null}
      <noscript>{map}</noscript>
      {children}
    </div>
  );
}
