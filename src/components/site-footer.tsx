import Link from "next/link";
import { fullAddress, site } from "@/config/site";
import { services } from "@/content/services";
import { Brand } from "./brand";
import { Icon } from "./icon";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>
              Clear guidance.
              <br />A considered way forward.
            </p>
            <span className="footer-tagline">{site.business.tagline}</span>
          </div>
          <div>
            <h2>Get in touch</h2>
            <address>{fullAddress}</address>
            <a href={site.phones.primary.href}>{site.phones.primary.display}</a>
            <a href={site.phones.office.href}>{site.phones.office.display}</a>
            <span className="footer-muted">Call to confirm appointment availability.</span>
          </div>
          <div>
            <h2>How we help</h2>
            {services.map((service) => (
              <Link key={service.slug} href={service.href}>
                {service.shortTitle}
              </Link>
            ))}
          </div>
          <div>
            <h2>Explore</h2>
            <Link href="/about">About the practice</Link>
            <Link href="/contact">Contact & location</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/disclaimer">Website disclaimer</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {site.business.name}
          </p>
          <p>
            General information only. Not legal advice. An inquiry does not create a
            paralegal–client relationship.
          </p>
        </div>
      </div>
    </footer>
  );
}
export function MobileCallBar() {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  return (
    <nav className="mobile-call-bar" aria-label="Quick contact">
      <a href={site.phones.primary.href}>
        <Icon name="phone" />
        Call now
      </a>
      <a href={directions} target="_blank" rel="noopener noreferrer">
        <Icon name="pin" />
        Directions
      </a>
      <Link href="/contact#consultation">
        <Icon name="document" />
        Get in touch
      </Link>
    </nav>
  );
}
