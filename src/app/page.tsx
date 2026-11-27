import { FaqItem } from "@/components/faq-item";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { getPageDraft, resolveCopy } from "@/content";
import { getPageMetadata, getLegalServiceSchema, getFaqSchema } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/public-content";
import { Icon } from "@/components/icon";
import { LocationSection, Portrait } from "@/components/site-sections";
import { ReviewsSection } from "@/components/reviews-section";
import { PracticeCarousel } from "@/components/practice-carousel";
import { RichText } from "@/components/rich-text";
import { JsonLd } from "@/components/json-ld";

export const metadata = getPageMetadata("/");

export default function HomePage() {
  const home = getPageDraft("/")!;
  const { faqs } = getPublicPageContent(home);

  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              LEGAL GUIDANCE. HUMAN APPROACH.
            </p>
            <h1>
              A clearer next step
              <br />
              for your <em>legal matter.</em>
            </h1>
            <p className="hero-description">
              Life is complicated. Getting legal help shouldn’t be.
              <br className="desktop-break" /> Licensed paralegal services in Scarborough, Toronto,
              <br className="desktop-break" /> with your next step in mind.
            </p>
            <div className="hero-actions">
              <Link href="/contact#consultation" className="button button-primary">
                Request a Consultation
                <Icon name="arrow-up-right" />
              </Link>
              <a href={site.phones.primary.href} className="hero-call">
                <Icon name="phone" />
                <span>
                  Prefer to call?<strong>{site.phones.primary.display}</strong>
                </span>
              </a>
            </div>
            <div className="hero-assurance">
              <span className="assurance-icon">
                <Icon name="shield" />
              </span>
              <div>
                Professional guidance.
                <br />
                <strong>A personal conversation.</strong>
              </div>
              <span className="assurance-rule" />
              <p>{site.business.tagline}</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap">
              <Image
                src="/images/toronto-skyline.webp"
                alt="Toronto’s waterfront skyline with the CN Tower"
                width={1600}
                height={645}
                sizes="(max-width: 760px) 100vw, 45vw"
                loading="eager"
                fetchPriority="high"
                className="hero-image"
              />
              <div className="hero-image-shade" />
              <span className="image-kicker">
                <span /> ROOTED IN OUR COMMUNITY
              </span>
              <div className="image-title">
                Here for your
                <br />
                <em>way forward.</em>
              </div>
              <div className="image-location">
                <Icon name="pin" />
                <span>SCARBOROUGH, TORONTO</span>
                <span className="image-location-line" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container trust-inner">
          <span>PROFESSIONAL CREDENTIALS</span>
          <span>
            <Icon name="shield" />
            Licensed Paralegal · Ontario
          </span>
          <span>
            <Icon name="pen" />
            Notary Public
          </span>
          <span>
            <Icon name="globe" />
            Advocate · Supreme Court of Bangladesh
          </span>
        </div>
      </div>
      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HOW WE CAN HELP</p>
              <h2>
                Different matters.
                <br />
                The same thoughtful approach.
              </h2>
            </div>
            <div>
              <p>
                A notice. A dispute. An important decision.
                <br />
                Start with the area that fits your situation.
              </p>
              <Link href="/practice-areas" className="text-link">
                Explore all services <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
          <PracticeCarousel />
        </div>
      </section>
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-portrait">
            <Portrait />
            <span className="about-portrait-note">A practice built around people.</span>
          </div>
          <div className="about-copy">
            <p className="eyebrow">MEET YOUR PARALEGAL</p>
            <h2>
              Legal matters are personal.
              <br />
              <em>So is our approach.</em>
            </h2>
            <p className="lead">
              Meet {site.business.principal}, principal of {site.business.name}.
            </p>
            <p>
              Sharf brings more than two decades of experience in legal services and advocacy in
              Bangladesh and Canada. He completed the Paralegal program at Centennial College and
              communicates in English, Bengali, and Sylheti.
            </p>
            <div className="about-credentials">
              <span>
                <Icon name="check" />
                Licensed Paralegal | Law Society of Ontario
              </span>
              <span>
                <Icon name="check" />
                Notary Public
              </span>
            </div>
            <Link href="/about" className="text-link">
              Read Sharf’s biography <Icon name="arrow-right" />
            </Link>
            <p className="credential-footnote">
              The Bangladesh advocate credential does not indicate a licence to practise as a lawyer
              in Ontario.
            </p>
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A SIMPLE PLACE TO START</p>
              <h2>One step at a time.</h2>
            </div>
            <p>
              You don’t need to know all the answers
              <br />
              before getting in touch.
            </p>
          </div>
          <div className="process-grid">
            {[
              {
                title: "Tell us what happened.",
                text: "Call or send a brief inquiry. Let us know what you’re facing and mention any upcoming dates.",
                icon: "document",
              },
              {
                title: "Understand your options.",
                text: "Discuss whether we can help, the work involved, and the fees before you make a decision.",
                icon: "globe",
              },
              {
                title: "Agree on a way forward.",
                text: "If we accept your matter and you retain the practice, we’ll set out the scope of work and next steps.",
                icon: "arrow-up-right",
              },
            ].map((step, index) => (
              <div className="process-step" key={step.title}>
                <div className="process-number">
                  <span>0{index + 1}</span>
                  <Icon name={step.icon} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <div className="process-bottom">
            <p>A first conversation doesn’t create a client relationship or protect a deadline.</p>
            <Link href="/contact#consultation" className="text-link">
              Let’s start a conversation <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
      <ReviewsSection />
      <section className="section faq-section">
        <div className="container faq-layout">
          <div>
            <p className="eyebrow">A FEW COMMON QUESTIONS</p>
            <h2>
              A little clarity,
              <br />
              before you call.
            </h2>
            <p>
              Can’t find your answer here?
              <br />
              We’re a phone call away.
            </p>
            <a href={site.phones.primary.href} className="text-link">
              {site.phones.primary.display} <Icon name="arrow-up-right" />
            </a>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <FaqItem question={resolveCopy(faq.question)} key={faq.question}>
                <RichText text={resolveCopy(faq.answer)} />
              </FaqItem>
            ))}
          </div>
        </div>
      </section>
      <LocationSection />
      <JsonLd data={getLegalServiceSchema()} />
      <JsonLd data={getFaqSchema(faqs)} />
    </>
  );
}
