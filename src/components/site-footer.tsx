import Link from "next/link";
import { fullAddress, site } from "@/config/site";
import { Icon } from "./icon";

// Replace the platform homepages with the practice's confirmed profiles.
const socialLinks = [
  { label: "Facebook", icon: "facebook", href: "https://www.facebook.com/" },
  { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/" },
  { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-compact">
        <p className="footer-copyright">
          © {new Date().getFullYear()} {site.business.shortName} Legal Services
        </p>
        <nav className="footer-legal-links" aria-label="Legal information">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/disclaimer">Website Disclaimer</Link>
        </nav>
        <nav className="footer-social-links" aria-label="Social media">
          {socialLinks.map(({ label, icon, href }) => (
            <a key={icon} href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
              <Icon name={icon} width={20} height={20} />
            </a>
          ))}
        </nav>
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
