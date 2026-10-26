import Link from "next/link";
import { site, fullAddress } from "@/config/site";
import { resolveCopy } from "@/content";
import { services } from "@/content/services";
import type { DraftFaq, DraftSection, PageDraft } from "@/content/types";
import { ContactForm } from "./contact-form";
import { isContactConfigured } from "@/lib/contact-server";
import { CTABand, LocationSection, Portrait } from "./site-sections";
import { RichText } from "./rich-text";

const operationalLabel =
  /^(?:CTA:|Related:|Link:|Buttons:|Editorial|Research:|Asset:|Portrait:|Office photograph:|Eyebrow:|H[1-6]:|Field labels|Directions link label:|Google listing link label:|Effective date:)/;

/** Editorial instructions are intentionally never sent to the page renderer. */
function cleanText(value: string): string {
  return resolveCopy(value)
    .replace(/`?\[(?:CONFIRM|PLACEHOLDER):[^\]]*\]`?/g, "")
    .replace(/\s+([.,])/g, "$1")
    .trim();
}

function publicBlocks(section: DraftSection): string[] {
  return section.blocks
    .filter((block) => block.kind === "copy" && !operationalLabel.test(block.markdown))
    .map((block) => cleanText(block.markdown))
    .filter(
      (text) =>
        text.length > 2 && !/^(Email|Hours|Consultations|Access|Privacy contact):/.test(text),
    );
}

export function getPublicPageContent(page: PageDraft) {
  const faqs: DraftFaq[] = page.faqs.map((faq) => ({
    question: cleanText(faq.question),
    answer:
      cleanText(faq.answer) ||
      "Please call the office to confirm the arrangements for your matter.",
  }));

  const questions = new Set(faqs.map((faq) => faq.question));
  const first = page.sections.find((section) => publicBlocks(section).length > 0);
  const intro = first ? publicBlocks(first) : [];

  const sections = page.sections
    .filter((section) => section !== first && !questions.has(cleanText(section.heading)))
    .filter(
      (section) =>
        !/^(?:Questions|Frequently asked|Discuss |Ask about|Not sure where)/i.test(section.heading),
    )
    .map((section) => ({
      heading: cleanText(section.heading).replace(
        /^Proposed approach$/,
        "What working together can look like",
      ),
      blocks: publicBlocks(section),
    }))
    .filter((section) => section.blocks.length > 0);

  return { intro, sections, faqs };
}

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
        <li aria-current="page">
          {page.route === "/about"
            ? "About"
            : page.route === "/contact"
              ? "Contact"
              : page.route === "/practice-areas"
                ? "Practice areas"
                : (services.find((service) => service.href === page.route)?.shortTitle ??
                  resolveCopy(page.h1))}
        </li>
      </ol>
    </nav>
  );
}

function Hero({ page, lead, eyebrow }: { page: PageDraft; lead: string; eyebrow: string }) {
  return (
    <header className="page-hero">
      <div className="container">
        <Breadcrumb page={page} />
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-title">{resolveCopy(page.h1)}</h1>
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
          <details className="faq-item" key={faq.question}>
            <summary>
              {faq.question}
              <span aria-hidden="true">+</span>
            </summary>
            <div className="prose">
              <RichText text={faq.answer} />
            </div>
          </details>
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
        {services
          .filter((service) => service.href !== current)
          .map((service) => (
            <Link href={service.href} key={service.slug}>
              {service.shortTitle}
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
            {services.map((service, index) => (
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
  return (
    <>
      <Hero
        page={page}
        eyebrow="THE PERSON BEHIND THE PRACTICE"
        lead={`Meet the principal of ${site.business.name}, a paralegal practice on Danforth Avenue in Scarborough.`}
      />
      <section className="section">
        <div className="container reading-layout">
          <article className="prose page-content">
            <Portrait />
            <h2>Clear guidance starts with understanding.</h2>
            <p>
              A legal problem often arrives as paperwork: a ticket, a notice, a claim, or a letter
              with an important date. Before you can decide what to do, you need to understand what
              it means and which process applies.
            </p>
            <p>
              {site.business.principal} is the principal of {site.business.name}. The practice lists
              traffic tickets and provincial offences, accident benefits claims, refugee hearings
              and appeals, landlord and tenant matters, employment and human rights matters, and
              Small Claims Court matters among its services.
            </p>
            <h2>Professional credentials</h2>
            <ul className="credential-list">
              {site.business.credentials.map((credential) => (
                <li key={credential}>{credential}</li>
              ))}
            </ul>
            <p className="form-note">
              The Bangladesh advocate credential relates to a different jurisdiction. It does not
              indicate a licence to practise as a lawyer in Ontario.
            </p>
            <div className="placeholder-note">
              <strong>A little more about Sharf, coming soon.</strong>
              <p>
                The full biography and a personal introduction will be added after they have been
                provided and reviewed.
              </p>
            </div>
            <h2>{site.business.tagline.replaceAll(" | ", ". ")}.</h2>
            <p>
              Start by discussing your situation, whether the practice can assist, and what a
              proposed retainer would involve. You can ask questions about the process and
              consultation arrangements before deciding how to proceed.
            </p>
            <h2>A Scarborough practice</h2>
            <p>
              {fullAddress}. Please call before travelling to confirm availability and appointment
              arrangements.
            </p>
          </article>
          <Sidebar current="/about" />
        </div>
      </section>
      <CTABand />
    </>
  );
}

function Contact({ page }: { page: PageDraft }) {
  return (
    <>
      <Hero
        page={page}
        eyebrow="LET’S START WITH A CONVERSATION"
        lead="Tell us what you need help with. We’ll discuss whether your matter is a fit and how to arrange a consultation."
      />
      <section className="section" id="consultation">
        <div className="container reading-layout">
          <div className="page-content">
            <p className="eyebrow">MAKE AN INQUIRY</p>
            <h2>What’s on your mind?</h2>
            <p>
              Keep your message brief and mention any upcoming hearing or response date. Please
              leave sensitive documents and personal records out of this first inquiry.
            </p>
            <ContactForm deliveryConfigured={isContactConfigured()} />
          </div>
          <aside className="page-sidebar">
            <div className="sidebar-card">
              <p className="eyebrow">PREFER TO CALL?</p>
              <h2>We’re a phone call away.</h2>
              <a className="contact-phone" href={site.phones.primary.href}>
                {site.phones.primary.display}
              </a>
              <a className="text-link" href={site.phones.office.href}>
                Office: {site.phones.office.display}
              </a>
              <div className="divider" />
              <h3>Our office</h3>
              <address>{fullAddress}</address>
              <p>Please call before visiting to confirm availability.</p>
              <p className="form-note">
                Office hours, consultation fees, and available appointment formats are being
                confirmed for this preview.
              </p>
              <div className="divider" />
              <h3>Have a deadline?</h3>
              <p>
                Call and explain the date at the start. Sending a message does not mean the practice
                has agreed to act or protect a deadline.
              </p>
            </div>
          </aside>
        </div>
      </section>
      <LocationSection large />
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
            {page.route !== "/disclaimer" ? (
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
              <>
                <h2>Services used by this preview</h2>
                <p>
                  The contact form sends inquiries to an email delivery provider only when delivery
                  has been configured. It does not store case files in this website. The embedded
                  Google Map is a third-party service; loading or interacting with it can share
                  technical information with Google.
                </p>
                <p>
                  No analytics or marketing tracking has been enabled. Final provider details,
                  retention periods, and the practice’s privacy contact will be added before
                  publication.
                </p>
              </>
            ) : null}
            {content.faqs.length ? <FaqList faqs={content.faqs} /> : null}
            <h2>Contact the office</h2>
            <p>
              {site.business.name}, {fullAddress}. Call{" "}
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
      <section className="section">
        <div className="container reading-layout">
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
          <Sidebar current={page.route} />
        </div>
      </section>
      <CTABand />
    </>
  );
}
