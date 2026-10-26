/** Supplied business-card facts; current licence and services await client approval. */
export const site = {
  stage: "phase-3-website-preview",
  business: {
    name: "Lexora Legal Services",
    shortName: "Lexora",
    principal: "Sharf Uddin Abead",
    tagline: "Trust | Dedication | Results",
    credentials: [
      "Licensed Paralegal | Law Society of Ontario",
      "Notary Public",
      "Advocate | Supreme Court of Bangladesh",
    ],
    independentlyVerified: false,
  },
  phones: {
    primary: { display: "416-722-3244", href: "tel:+14167223244" },
    office: { display: "416-900-0494", href: "tel:+14169000494" },
  },
  address: {
    street: "3205 Danforth Avenue",
    city: "Scarborough",
    province: "ON",
    postalCode: "M1L 1B8",
    country: "CA",
  },
  // Unknown facts stay null. Private-preview samples live in content, not here.
  email: null,
  domain: null,
  officeHours: null,
  consultationModel: null,
  languages: null,
  licenceNumber: null,
  headshot: null,
  logo: null,
  googleMapsProfileUrl: null,
  googleMapsEmbedUrl: null,
  whatsapp: null,
} as const;

export const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.province} ${site.address.postalCode}`;

/** Replace these tokens when consuming copy; do not duplicate business facts in components. */
export const contentTokens = {
  "business.name": site.business.name,
  "business.shortName": site.business.shortName,
  "business.principal": site.business.principal,
  "business.tagline": site.business.tagline,
  "business.paralegalCredential": site.business.credentials[0],
  "business.notaryCredential": site.business.credentials[1],
  "business.bangladeshCredential": site.business.credentials[2],
  "phone.primary": site.phones.primary.display,
  "phone.primaryHref": site.phones.primary.href,
  "phone.office": site.phones.office.display,
  "phone.officeHref": site.phones.office.href,
  "address.full": fullAddress,
  "address.street": site.address.street,
  "address.postalCode": site.address.postalCode,
} as const;
