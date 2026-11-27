import Image from "next/image";
import { FaqItem } from "./faq-item";
import Link from "next/link";
import { site, fullAddress } from "@/config/site";
import { getPageHeading } from "@/content";
import { practiceAreas } from "@/content/services";
import type { DraftFaq, PageDraft } from "@/content/types";
import { ContactForm } from "./contact-form";
import { isContactConfigured } from "@/lib/contact-server";
import { CTABand, Portrait } from "./site-sections";
import { RichText } from "./rich-text";
import { Icon } from "./icon";
import { DeferredMap } from "./deferred-map";
import { cleanText, publicBlocks, getPublicPageContent } from "@/lib/public-content";

function Breadcrumb({ page }: { page: PageDraft }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {page.route.startsWith("/practice-areas/") ? (
          <li>
            <Link href="/practice-areas">Practice areas</Link>
          </li>
        ) : null}
        <li aria-current="page">{getPageHeading(page)}</li>
      </ol>
    </nav>
  );
}

function Hero({ page, lead, eyebrow }: { page: PageDraft; lead: string; eyebrow: string }) {
  return (
    <header className="page-hero">
      <Image className="page-hero-image" src="/legal-architecture.webp" alt="" fill sizes="100vw" />
      <div className="container">
        <Breadcrumb page={page} />
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-title">{getPageHeading(page)}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
    </header>
  );
}

function FaqList({ faqs }: { faqs: DraftFaq[] }) {
  if (!faqs.length) {
    return null;
  }

  return (
    <section className="page-faq">
      <p className="eyebrow">A LITTLE CLARITY</p>
      <h2>Your questions, answered.</h2>
      <div className="faq-list">
        {faqs.map((faq) => (
          <FaqItem question={faq.question} key={faq.question}>
            <RichText text={faq.answer} />
          </FaqItem>
        ))}
      </div>
    </section>
  );
}

function Sidebar({ current }: { current: string }) {
  return (
    <aside className="page-sidebar">
      <div className="sidebar-card">
        <p className="eyebrow">LET’S TALK</p>
        <h2>A good place to start.</h2>
        <p>Tell us briefly what happened and mention any approaching date.</p>
        <Link className="button button-primary" href="/contact">
          Request a Consultation <span aria-hidden="true">↗</span>
        </Link>
        <a className="text-link" href={site.phones.primary.href}>
          Call {site.phones.primary.display}
        </a>
        <p className="form-note">
          Consultation arrangements and fees are confirmed before booking.
        </p>
      </div>
      <nav className="sidebar-links" aria-label="Other practice areas">
        <h3>Explore our services</h3>
        {practiceAreas
          .filter((service) => service.href !== current)
          .map((service) => (
            <Link href={service.href} key={service.slug}>
              {service.title}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
      </nav>
    </aside>
  );
}

function ServicesOverview({ page }: { page: PageDraft }) {
  return (
    <>
      <Hero
        page={page}
        eyebrow="HOW WE CAN HELP"
        lead="You do not need to know the legal category before reaching out. Start with the situation that feels closest to yours."
      />
      <section className="section">
        <div className="container">
          <div className="service-grid">
            {practiceAreas.map((service, index) => (
              <Link className="service-card" href={service.href} key={service.slug}>
                <span className="service-number">0{index + 1}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <span className="text-link">
                  Explore this service <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CTABand />
    </>
  );
}

function About({ page }: { page: PageDraft }) {
  const { intro, sections } = getPublicPageContent(page);

  return (
    <>
      <Hero
        page={page}
        eyebrow="ABOUT"
        lead="Professional paralegal services in Scarborough and Toronto, with a clear and personal approach."
      />
      <section className="section about-introduction">
        <div className="container biography-grid">
          <Portrait />
          <article className="biography-panel prose">
            <h2>{site.business.principal}</h2>
            <p className="eyebrow">PRINCIPAL PARALEGAL</p>
            {intro.map((text, index) => (
              <RichText key={index} text={text} />
            ))}
            <ul className="credential-list">
              {site.business.credentials.map((credential, index) => (
                <li key={credential}>
                  <Icon name={["shield", "document", "globe"][index]} />
                  {credential}
                </li>
              ))}
            </ul>
            <p className="form-note">
              The Bangladesh advocate credential does not indicate a licence to practise as a lawyer
              in Ontario.
            </p>
          </article>
        </div>
      </section>
      {sections.map((section, index) => (
        <section className={index % 2 === 0 ? "editorial-band" : "section"} key={section.heading}>
          <div className="container editorial-row">
            <h2>{section.heading}</h2>
            <div className="prose">
              {section.blocks.map((text, block) => (
                <RichText key={block} text={text} />
              ))}
            </div>
          </div>
        </section>
      ))}
      <section className="editorial-band">
        <div className="container editorial-row">
          <h2>Our Practice Focus</h2>
          <div className="focus-links">
            {practiceAreas.map((service) => (
              <Link href={service.href} key={service.slug}>
                <Icon name="check" />
                {service.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CTABand />
    </>
  );
}

function Contact({ page }: { page: PageDraft }) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
  const listing = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <>
      <Hero
        page={page}
        eyebrow="CONTACT"
        lead="Have a legal matter or need notary services? Call the office or send a consultation request. Start with a conversation about your options."
      />
      <section className="section" id="consultation">
        <div className="container contact-layout">
          <div className="contact-main">
            <div className="consultation-panel">
              <h2>Request a Consultation</h2>
              <p>
                Tell us briefly what you need help with. Please leave sensitive documents and
                personal records out of this first inquiry.
              </p>
              <ContactForm deliveryConfigured={isContactConfigured()} />
            </div>
          </div>
          <aside className="contact-information">
            <h2>{site.business.name}</h2>
            <p className="eyebrow">ONTARIO PARALEGAL PRACTICE</p>
            <div className="contact-detail">
              <Icon name="pin" />
              <div>
                <h3>Office address</h3>
                <address>{fullAddress}</address>
              </div>
            </div>
            <div className="contact-detail">
              <Icon name="phone" />
              <div>
                <h3>Phone</h3>
                <a href={site.phones.primary.href}>{site.phones.primary.display}</a>
                <a href={site.phones.office.href}>{site.phones.office.display}</a>
              </div>
            </div>
            <div className="contact-detail">
              <Icon name="document" />
              <div>
                <h3>Email</h3>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </div>
            </div>
            <div className="contact-detail">
              <Icon name="clock" />
              <div>
                <h3>Office hours</h3>
                <p>Call to confirm hours and appointment availability.</p>
                <p className="form-note">Consultation terms and fees are being confirmed.</p>
              </div>
            </div>
            <a className="button button-primary" href={site.phones.primary.href}>
              <Icon name="phone" />
              Call Now
            </a>
            <a
              className="button button-outline"
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="pin" />
              Get Directions
            </a>
            <a
              className="button button-outline"
              href={listing}
              target="_blank"
              rel="noopener noreferrer"
            >
              View address on Google Maps
            </a>
            <p className="form-note">
              Have a deadline? Call and explain the date. An inquiry does not mean the practice has
              agreed to act or protect a deadline.
            </p>
          </aside>
        </div>
      </section>
      <section className="editorial-band">
        <div className="container next-steps">
          <h2>What happens after you contact us</h2>
          {[
            {
              title: "We review your inquiry",
              text: "The office reviews the brief details you provide.",
            },
            {
              title: "We discuss the next step",
              text: "The office can use your contact details to discuss whether it can help.",
            },
            {
              title: "We confirm the arrangements",
              text: "Scope, consultation terms, and any proposed work are discussed before proceeding.",
            },
          ].map((step, index) => (
            <article key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section contact-map-section" aria-label="Office location">
        <div className="container">
          <div id="location">
            <DeferredMap
              src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=15&output=embed`}
            >
              <span className="map-caption">
                {site.address.street} · {site.address.city}
              </span>
            </DeferredMap>
          </div>
        </div>
      </section>
    </>
  );
}

function ThankYou({ page }: { page: PageDraft }) {
  return (
    <>
      <Hero
        page={page}
        eyebrow="THANK YOU FOR REACHING OUT"
        lead="If you arrived here after sending the form, your inquiry was accepted by the delivery service for the office to review."
      />
      <section className="section">
        <div className="container prose" style={{ maxWidth: "48rem" }}>
          <h2>What happens next?</h2>
          <p>
            The office can use the details you provided to get in touch. An acknowledgement does not
            mean your matter has been accepted or that representation has begun.
          </p>
          <p>
            Have a deadline approaching? Call{" "}
            <a href={site.phones.primary.href}>{site.phones.primary.display}</a>. If you cannot
            reach the office, do not assume your matter is being handled.
          </p>
          <div className="button-row">
            <a className="button button-primary" href={site.phones.primary.href}>
              Call the Office
            </a>
            <Link className="button button-secondary" href="/">
              Return Home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function LegalPage({ page }: { page: PageDraft }) {
  const content = getPublicPageContent(page);

  const sections = page.sections
    .map((section) => ({
      heading: cleanText(section.heading),
      depth: section.depth,
      blocks: publicBlocks(section),
    }))
    .filter((section) => section.blocks.length > 0);

  return (
    <>
      <Hero
        page={page}
        eyebrow="INFORMATION & POLICIES"
        lead={
          page.route === "/privacy-policy"
            ? "How website inquiries and personal information are handled."
            : page.route === "/accessibility"
              ? "Clear information and straightforward ways to ask for assistance."
              : "Please read this information before relying on the website or sending an inquiry."
        }
      />
      <section className="section">
        <div className="container reading-layout">
          <article className="prose page-content">
            {page.route === "/accessibility" ? (
              <div className="placeholder-note">
                <strong>Preview policy — final review pending.</strong>
                <p>
                  Some details are still being confirmed. Please call the office with questions
                  about privacy, access, or appointment arrangements.
                </p>
              </div>
            ) : null}
            {sections.map((section, index) => (
              <section key={`${section.heading}-${index}`}>
                {section.depth === 3 ? <h2>{section.heading}</h2> : null}
                {section.blocks.map((text, item) => (
                  <RichText text={text} key={item} />
                ))}
              </section>
            ))}
            {page.route === "/privacy-policy" ? (
              <p>
                See also: <Link href="/disclaimer">Website Disclaimer</Link>
              </p>
            ) : null}
            {content.faqs.length ? <FaqList faqs={content.faqs} /> : null}
            <h2>Contact the office</h2>
            <p>
              {site.business.name}
              {", "}
              {fullAddress}. Call{" "}
              <a href={site.phones.primary.href}>{site.phones.primary.display}</a> or{" "}
              <a href={site.phones.office.href}>{site.phones.office.display}</a>.
            </p>
          </article>
          <Sidebar current={page.route} />
        </div>
      </section>
    </>
  );
}

export function ContentPage({ page }: { page: PageDraft }) {
  if (page.route === "/practice-areas") {
    return <ServicesOverview page={page} />;
  }

  if (page.route === "/about") {
    return <About page={page} />;
  }

  if (page.route === "/contact") {
    return <Contact page={page} />;
  }

  if (page.route === "/thank-you") {
    return <ThankYou page={page} />;
  }

  if (["/privacy-policy", "/accessibility", "/disclaimer"].includes(page.route))
    return <LegalPage page={page} />;

  const content = getPublicPageContent(page);

  return (
    <>
      <Hero page={page} eyebrow="PARALEGAL SERVICES · SCARBOROUGH" lead={content.intro[0] ?? ""} />
      <section className="section service-detail-section">
        <div className="container service-detail-layout">
          <article className="prose page-content">
            {content.intro.slice(1).map((text, index) => (
              <RichText text={text} key={index} />
            ))}
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.blocks.map((text, index) => (
                  <RichText text={text} key={index} />
                ))}
              </section>
            ))}
            <FaqList faqs={content.faqs} />
          </article>
          <nav className="related-services" aria-label="Other practice areas">
            <h2>Explore our services</h2>
            {practiceAreas
              .filter((service) => service.href !== page.route)
              .map((service) => (
                <Link href={service.href} key={service.slug}>
                  {service.title}
                  <Icon name="arrow-right" />
                </Link>
              ))}
          </nav>
        </div>
      </section>
      <CTABand />
    </>
  );
}
