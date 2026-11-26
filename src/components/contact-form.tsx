"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { site } from "../config/site";
import { contactTopics, validateContact } from "../lib/contact";
import type { ContactErrors, ContactField, ContactResult } from "../lib/contact";

export function ContactForm({ deliveryConfigured = false }: { deliveryConfigured?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ContactResult | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  const [errors, setErrors] = useState<ContactErrors>({});

  useEffect(() => {
    if (result && !result.ok) {
      summary.current?.focus();
    }
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const input = Object.fromEntries(data.entries());
    const checked = validateContact(input);

    if (!checked.ok) {
      setErrors(checked.errors);
      setResult({ ok: false, message: "Please check the fields below.", errors: checked.errors });
      return;
    }

    const fingerprint = JSON.stringify(input);

    if (submission.current?.fingerprint !== fingerprint)
      submission.current = { fingerprint, id: crypto.randomUUID() };

    data.set("submissionId", submission.current.id);
    inFlight.current = true;
    setPending(true);
    setResult(null);
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(18000),
      });

      const payload: unknown = await response.json();

      if (!payload || typeof payload !== "object" || !("ok" in payload) || !("message" in payload))
        throw new Error("Invalid response");

      const next = payload as ContactResult;

      if (response.ok && next.ok === true) {
        router.push("/thank-you");
        return;
      }

      setErrors(next.errors ?? {});
      setResult({ ...next, ok: false });
    } catch {
      setResult({
        ok: false,
        message:
          "We could not confirm that your request was sent. Please call the office, or try again using this form.",
      });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  function validateField(target: EventTarget) {
    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )) {
      return;
    }

    if (
      !target.form ||
      !["name", "phone", "email", "topic", "message", "consent"].includes(target.name)
    ) {
      return;
    }

    const field = target.name as ContactField;
    const checked = validateContact(Object.fromEntries(new FormData(target.form).entries()));
    const message = checked.ok ? undefined : checked.errors[field];

    setErrors((previous) => {
      const next = { ...previous };

      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }

      return next;
    });
  }

  function fieldDescription(field: ContactField, help?: string) {
    return (
      [help, errors[field] ? `contact-${field}-error` : null].filter(Boolean).join(" ") || undefined
    );
  }

  function fieldError(field: ContactField) {
    return errors[field] ? (
      <p className="field-error" id={`contact-${field}-error`} aria-live="polite">
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form
      action="/api/contact"
      method="post"
      onSubmit={handleSubmit}
      onBlur={(event) => validateField(event.target)}
      onChange={(event) => {
        const target = event.target;

        if ("name" in target && errors[target.name as ContactField]) {
          validateField(target);
        }

        if (result) {
          setResult(null);
        }
      }}
      noValidate
      aria-busy={pending}
      className="form-grid"
    >
      {!deliveryConfigured ? (
        <p className="form-note field-wide" role="note">
          Preview mode: email delivery is not connected yet. Please call{" "}
          <a href={site.phones.primary.href}>{site.phones.primary.display}</a> to contact the
          office.
        </p>
      ) : null}
      <p className="form-note field-wide" id="contact-privacy-help">
        Tell us the basics and any upcoming date. Please leave out sensitive documents, medical
        details, identity numbers, and detailed immigration history.
      </p>
      <noscript>
        <p className="form-note field-wide">
          You can submit this form without JavaScript. If you need help, call{" "}
          <a href={site.phones.primary.href}>{site.phones.primary.display}</a>.
        </p>
      </noscript>
      <div hidden aria-hidden="true">
        <label htmlFor="contact-website">Leave this field blank</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {result ? (
        <div className="form-status field-wide" role="alert" tabIndex={-1} ref={summary}>
          <p>{result.message}</p>
          <p>
            Call <a href={site.phones.primary.href}>{site.phones.primary.display}</a> or{" "}
            <a href={site.phones.office.href}>{site.phones.office.display}</a> if you need to get in
            touch.
          </p>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="contact-name">
          Full name <span aria-hidden="true">*</span>
        </label>
        <input
          className="input"
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={fieldDescription("name")}
        />
        {fieldError("name")}
      </div>
      <div className="field">
        <label htmlFor="contact-phone">
          Phone number <span aria-hidden="true">*</span>
        </label>
        <input
          className="input"
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          maxLength={40}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={fieldDescription("phone", "contact-phone-help")}
        />
        <small id="contact-phone-help">
          For example, 416-555-0123. Include + and the country code for international numbers.
        </small>
        {fieldError("phone")}
      </div>
      <div className="field">
        <label htmlFor="contact-email">
          Email address <span className="field-optional">(optional)</span>
        </label>
        <input
          className="input"
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescription("email")}
        />
        {fieldError("email")}
      </div>
      <div className="field">
        <label htmlFor="contact-topic">
          What do you need help with? <span aria-hidden="true">*</span>
        </label>
        <select
          className="input"
          id="contact-topic"
          name="topic"
          required
          defaultValue=""
          aria-invalid={Boolean(errors.topic)}
          aria-describedby={fieldDescription("topic")}
        >
          <option value="" disabled>
            Select a service
          </option>
          {contactTopics.map((topic) => (
            <option value={topic.value} key={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
        {fieldError("topic")}
      </div>
      <div className="field field-wide">
        <label htmlFor="contact-message">
          Brief description <span className="field-optional">(optional)</span>
        </label>
        <textarea
          className="input"
          id="contact-message"
          name="message"
          rows={5}
          maxLength={2000}
          placeholder="Briefly describe your matter and mention any upcoming date."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={fieldDescription("message", "contact-privacy-help")}
        />
        {fieldError("message")}
      </div>
      <div className="field field-wide">
        <label className="checkbox-label" htmlFor="contact-consent">
          <input
            type="checkbox"
            id="contact-consent"
            name="consent"
            required
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={fieldDescription("consent")}
          />
          <span>
            I understand that submitting this form does not create a paralegal–client relationship
            or mean that {site.business.shortName} has agreed to act or meet a deadline for me.
          </span>
        </label>
        {fieldError("consent")}
      </div>
      <p className="form-note field-wide">
        Your contact details and message are used to assess and respond to your inquiry. Read our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>. Asterisks indicate required fields.
      </p>
      <div className="field-wide">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Sending your request…" : "Send Consultation Request"}
        </button>
      </div>
    </form>
  );
}
