import Link from "next/link";
import { fullAddress, site } from "@/config/site";
import { practiceAreas } from "@/content/services";
import { Icon } from "./icon";
import { DeferredMap } from "./deferred-map";

export function PracticeGrid({ overview = false }: { overview?: boolean }) {
  return (
    <div className="practice-grid">
      {practiceAreas.map((service, index) => (
        <Link
          key={service.slug}
          href={service.href}
          className={`practice-card ${index === 6 ? "practice-card-wide" : ""}`}
        >
          <div className="practice-card-top">
            <span className="service-icon">
              <Icon name={service.icon} />
            </span>
            <span className="service-index">0{index + 1}</span>
          </div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <span className="text-link">
            {overview ? "Explore this service" : "Find out more"}
            <Icon name="arrow-up-right" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function CTABand() {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <div>
          <p className="eyebrow">LET’S FIND YOUR NEXT STEP</p>
          <h2>
            You don’t have to figure
            <br className="desktop-break" /> it all out on your own.
          </h2>
          <p>Start with a conversation about your matter and your options.</p>
        </div>
        <div className="cta-actions">
          <Link href="/contact#consultation" className="button button-light">
            Request a Consultation <Icon name="arrow-up-right" />
          </Link>
          <a href={site.phones.primary.href} className="cta-phone">
            <Icon name="phone" />
            {site.phones.primary.display}
          </a>
          <a href={site.phones.office.href} className="cta-secondary-phone">
            Office: {site.phones.office.display}
          </a>
          <span className="cta-address">{fullAddress}</span>
        </div>
      </div>
    </section>
  );
}

export function LocationSection({ large = false }: { large?: boolean }) {
  const query = encodeURIComponent(fullAddress);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const map = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const listing = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <section className={`section location-section ${large ? "location-large" : ""}`} id="location">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RIGHT HERE IN SCARBOROUGH</p>
            <h2>
              A local office.
              <br />
              An open conversation.
            </h2>
          </div>
          <p>
            Find us on Danforth Avenue.
            <br />
            Please call before visiting.
          </p>
        </div>
        <div className="location-grid">
          <div className="location-card">
            <span className="location-pin">
              <Icon name="pin" />
            </span>
            <h3>Visit {site.business.shortName}</h3>
            <address>
              {site.address.street}
              <br />
              {site.address.city}, {site.address.province} {site.address.postalCode}
            </address>
            <div className="location-detail">
              <Icon name="phone" />
              <div>
                <a href={site.phones.primary.href}>{site.phones.primary.display}</a>
                <a href={site.phones.office.href}>{site.phones.office.display}</a>
              </div>
            </div>
            <div className="location-detail">
              <Icon name="clock" />
              <p>
                Call to confirm hours
                <br />
                and appointment availability.
              </p>
            </div>
            <a
              className="button button-light"
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions <Icon name="arrow-up-right" />
            </a>
            <a
              href={listing}
              target="_blank"
              rel="noopener noreferrer"
              className="location-map-link"
            >
              View address on Google Maps <Icon name="arrow-up-right" />
            </a>
          </div>
          <DeferredMap
            src={map}
            title={`Map showing ${site.business.name} address: ${fullAddress}`}
          >
            <span className="map-caption">
              {site.address.street} · {site.address.city}
            </span>
          </DeferredMap>
        </div>
      </div>
    </section>
  );
}

export function Portrait() {
  return (
    <div
      className="portrait-placeholder"
      role="img"
      aria-label={`Portrait placeholder for ${site.business.principal}`}
    >
      <span className="portrait-lines" aria-hidden="true" />
      <span className="portrait-initials" aria-hidden="true">
        SA
      </span>
      <span className="portrait-label">PORTRAIT PLACEHOLDER</span>
      <span className="portrait-name">
        {site.business.principal}
        <small>Photo to be supplied</small>
      </span>
    </div>
  );
}
