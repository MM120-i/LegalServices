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

const namePattern = /^[\p{L}\p{M} .'’ʼ·-]+$/u;
const emailLocalPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;

/** Checks syntax only; an address passing validation may still have no mailbox. */
export function isEmail(value: string): boolean {
  if (value.length > 254 || /[\s\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }

  const parts = value.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    !emailLocalPattern.test(local) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) {
    return false;
  }

  const labels = domain.split(".");

  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label),
    ) &&
    /[a-zA-Z]/.test(labels.at(-1)!)
  );
}

function isPhone(value: string): boolean {
  if (value.length > 40 || !/^\+?[\d ().-]+$/.test(value)) {
    return false;
  }

  // Parentheses must form a single, complete area-code group when supplied.
  if ((value.includes("(") || value.includes(")")) && !/^[^()]*\(\d{3}\)[^()]*$/.test(value))
    return false;

  const digits = value.replace(/\D/g, "");

  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  if (!value.startsWith("+") || digits.startsWith("1")) {
    return /^(?:1)?[2-9]\d{2}[2-9]\d{6}$/.test(digits);
  }

  return /^[2-9]\d{7,14}$/.test(digits);
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

  if (name.length < 2 || name.length > 100 || !namePattern.test(name) || !/\p{L}/u.test(name))
    errors.name =
      "Enter your name using letters, spaces, apostrophes or hyphens (2–100 characters).";

  if (!isPhone(phone)) {
    errors.phone =
      "Enter a 10-digit Canadian/US number, or an international number starting with + and its country code.";
  }

  if (email && !isEmail(email))
    errors.email = "Enter an email such as name@example.com, or leave this field blank.";

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
    value: {
      name: name.normalize("NFC").replace(/ +/g, " "),
      phone,
      email,
      topic: topic as ContactTopic,
      message,
      consent: true,
    },
    honeypot: Boolean(text("website")),
  };
}
