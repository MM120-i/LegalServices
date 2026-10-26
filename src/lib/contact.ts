export const contactTopics = [
  { value: "traffic-tickets", label: "Traffic Tickets / Provincial Offences" },
  { value: "accident-benefits", label: "Accident Benefits Claims" },
  { value: "refugee-hearings", label: "Refugee Hearings & Appeals" },
  { value: "landlord-tenant", label: "Landlord & Tenant Matters" },
  { value: "employment-human-rights", label: "Employment & Human Rights Matters" },
  { value: "small-claims", label: "Small Claims Court Matters" },
  { value: "notary", label: "Notary Public & Commissioning" },
  { value: "other", label: "Other / Not sure" },
] as const;

export type ContactTopic = (typeof contactTopics)[number]["value"];
export type ContactField = "name" | "phone" | "email" | "topic" | "message" | "consent";
export type ContactErrors = Partial<Record<ContactField, string>>;

export interface ContactInquiry {
  name: string;
  phone: string;
  email: string;
  topic: ContactTopic;
  message: string;
  consent: true;
}

export interface ContactResult {
  ok: boolean;
  message: string;
  errors?: ContactErrors;
}

export type ContactValidation =
  { ok: true; value: ContactInquiry; honeypot: boolean } | { ok: false; errors: ContactErrors };

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function isEmail(value: string): boolean {
  return value.length <= 254 && emailPattern.test(value);
}

/** Browser checks are for convenience; the server runs the same checks independently. */
export function validateContact(input: Record<string, unknown>): ContactValidation {
  const text = (key: string) => (typeof input[key] === "string" ? input[key].trim() : "");
  const name = text("name");
  const phone = text("phone");
  const email = text("email");
  const topic = text("topic");
  const message = text("message");
  const consent = input.consent === "on" || input.consent === true;
  const errors: ContactErrors = {};

  if (name.length < 2 || name.length > 100 || /[\r\n\u0000-\u001f]/.test(name))
    errors.name = "Please enter your name (2–100 characters).";

  if (
    phone.length > 40 ||
    !/^[+\d\s().\-]+$/.test(phone) ||
    phone.replace(/\D/g, "").length < 7 ||
    phone.replace(/\D/g, "").length > 15
  ) {
    errors.phone = "Please enter a phone number where the office can reach you.";
  }

  if (email && !isEmail(email))
    errors.email = "Please check your email address, or leave it blank.";

  if (!contactTopics.some((item) => item.value === topic))
    errors.topic = "Please choose a service or select ‘Other / Not sure.’";

  if (message.length > 2000 || /\u0000/.test(message))
    errors.message = "Please keep your description under 2,000 characters.";

  if (!consent) {
    errors.consent = "Please acknowledge the statement before sending.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { name, phone, email, topic: topic as ContactTopic, message, consent: true },
    honeypot: Boolean(text("website")),
  };
}
