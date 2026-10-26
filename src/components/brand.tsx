import Link from "next/link";
import { site } from "@/config/site";

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 40" fill="none" aria-hidden="true">
          <path d="M10 7h9M14 7 8 32h14l4-7M5 32h6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M23 5h6v6M29 5l-8 8" stroke="currentColor" strokeWidth="1" />
        </svg>
      </span>
      <span className="brand-type">
        {site.business.shortName.toLowerCase()} <span>LEGAL SERVICES</span>
      </span>
    </Link>
  );
}
