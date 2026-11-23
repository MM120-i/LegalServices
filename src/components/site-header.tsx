"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { fullAddress, site } from "@/config/site";
import { practiceAreas } from "@/content/services";
import { Icon } from "./icon";
import { Brand } from "./brand";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const close = () => setMenuOpen(false);
  const dropdownTrigger = useRef<HTMLAnchorElement>(null);
  const [dropdownDismissed, setDropdownDismissed] = useState(false);

  const nav = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/practice-areas", label: "Practice Areas" },
    { href: "/notary-public", label: "Notary Public" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <a href={site.phones.primary.href}>
            <Icon name="phone" />
            {site.phones.primary.display}
          </a>
          <a href={site.phones.office.href}>
            <Icon name="telephone" />
            {site.phones.office.display}
          </a>
          <span className="topbar-location">
            <Icon name="pin" />
            {fullAddress}
          </span>
          <span className="topbar-credential">
            <Icon name="shield" />
            Licensed Paralegal · Law Society of Ontario
          </span>
        </div>
      </div>
      <header
        className="site-header"
        onKeyDown={(event) => {
          if (event.key !== "Escape") {
            return;
          }

          if (menuOpen) {
            close();
            menuButton.current?.focus();
          } else if (event.target instanceof Element && event.target.closest(".nav-dropdown")) {
            event.preventDefault();
            dropdownTrigger.current?.focus();
            setDropdownDismissed(true);
          }
        }}
      >
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map((item) => (
              <div
                key={item.href}
                data-dismissed={
                  item.label === "Practice Areas" && dropdownDismissed ? "true" : undefined
                }
                onMouseEnter={() => setDropdownDismissed(false)}
                onBlur={(event) => {
                  if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                  ) {
                    setDropdownDismissed(false);
                  }
                }}
                className={item.label === "Practice Areas" ? "nav-dropdown" : "nav-item"}
              >
                <Link
                  ref={item.label === "Practice Areas" ? dropdownTrigger : undefined}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                  {item.label === "Practice Areas" ? (
                    <span className="nav-chevron" aria-hidden="true">
                      ⌄
                    </span>
                  ) : null}
                </Link>
                {item.label === "Practice Areas" ? (
                  <div className="dropdown-panel">
                    {practiceAreas.map((service) => (
                      <Link href={service.href} key={service.slug}>
                        {service.title}
                        <Icon name="arrow-up-right" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
          <Link href="/contact" className="button button-primary header-cta">
            Request a Consultation
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
        <nav
          id="mobile-navigation"
          hidden={!menuOpen}
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
              <Icon name="arrow-up-right" />
            </Link>
          ))}
          <a href={site.phones.primary.href} onClick={close}>
            Call {site.phones.primary.display}
          </a>
        </nav>
        <noscript>
          <style>{".menu-toggle{display:none}"}</style>
          <details className="nojs-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              {nav.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </noscript>
      </header>
    </>
  );
}
