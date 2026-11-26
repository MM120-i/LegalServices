import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Page Not Found | Abead Legal Services",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="section not-found">
      <div className="container">
        <p className="eyebrow">404 · A DIFFERENT DIRECTION</p>
        <h1>
          Let’s find your
          <br />
          <em>way back.</em>
        </h1>
        <p>
          The page you’re looking for may have moved.
          <br />
          Our services and contact details are right here.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button button-secondary">
            Return to Home
          </Link>
          <Link href="/practice-areas" className="button button-primary">
            View Practice Areas
            <Icon name="arrow-right" />
          </Link>
          <Link href="/contact#consultation" className="button button-secondary">
            Request a Consultation
          </Link>
        </div>
        <a className="text-link" href={site.phones.primary.href}>
          Call {site.phones.primary.display}
          <Icon name="phone" />
        </a>
      </div>
    </section>
  );
}
