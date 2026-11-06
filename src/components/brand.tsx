import Link from "next/link";
import { site } from "@/config/site";

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M32 8v43M18 52h28M24 57h16M15 21h34M32 13l-4 7m4-7 4 7M17 22 9 40h16l-8-18Zm30 0-8 18h16l-8-18Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M19 57C-2 45 1 21 10 9M45 57C66 45 63 21 54 9M10 16 5 15m3 11-5-2m6 12-6-1m11 12-6-1m46-30 5-1m-3 11 5-2m-6 12 6-1m-11 12 6-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="brand-type">
        {site.business.shortName.toUpperCase()} <span>LEGAL SERVICES</span>
      </span>
    </Link>
  );
}
