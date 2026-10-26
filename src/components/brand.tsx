import Link from "next/link";
import { site } from "@/config/site";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label={`${site.business.name} home`}>
      <span className="brand-mark" aria-hidden="true">
        L<span>↗</span>
      </span>
      <span className="brand-type">
        {site.business.shortName.toLowerCase()}
        <span>LEGAL SERVICES</span>
      </span>
    </Link>
  );
}
