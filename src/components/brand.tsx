import Link from "next/link";
import { site } from "@/config/site";

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="990 74 296 222" fill="none" aria-hidden="true">
          <path
            d="M1163 78c-2 8-5 14-11 18 7 2 9 6 7 10l-4 5 8 6 8-6-4-5c-2-4 0-8 7-10-6-4-9-10-11-18Z"
            fill="currentColor"
          />
          <path
            d="M1073 129c-6 6 9 12 22 5 17-8 31-22 46-17 13 4 18 15 22 26 4-11 9-22 22-26 15-5 29 9 46 17 13 7 28 1 22-5"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M1158 132h10l57 133-27-10-45-89-39 98c-5 13-3 19 13 22v4h-53v-4c13-4 20-14 27-30Z"
            fill="currentColor"
          />
          <path
            d="M995 292c24-39 80-59 127-55 52 4 79 35 122 39 13 1 25 0 37-4-19 17-41 21-66 12-32-11-61-31-96-33-51-4-96 11-124 41Z"
            fill="currentColor"
          />
          <path
            d="m1078 141-26 68h52l-26-68v68m174-68-26 68h52l-26-68v68"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M1049 208h58c-5 14-16 20-29 20s-24-6-29-20Zm174 0h58c-5 14-16 20-29 20s-24-6-29-20Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="brand-type">
        {site.business.shortName.toUpperCase()} <span>LEGAL SERVICES</span>
      </span>
    </Link>
  );
}
