"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { site } from "../config/site";
import { validateReview } from "../lib/reviews";
import type { ReviewErrors, ReviewField, ReviewResult } from "../lib/reviews";

export function ReviewForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [errors, setErrors] = useState<ReviewErrors>({});
  const status = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);

  useEffect(() => {
    if (result) status.current?.focus();
  }, [result]);

  function validateField(target: EventTarget) {
    if (
      !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) ||
      !target.form
    )
      return;
    if (!["displayName", "email", "rating", "text", "genuine"].includes(target.name)) return;
    const field = target.name as ReviewField;
    const checked = validateReview(Object.fromEntries(new FormData(target.form)));
    setErrors((previous) => {
      const next = { ...previous };
      if (!checked.ok && checked.errors[field]) next[field] = checked.errors[field];
      else delete next[field];
      return next;
    });
  }

  function error(field: ReviewField) {
    return errors[field] ? (
      <p className="field-error" id={`review-${field}-error`} aria-live="polite">
        {errors[field]}
      </p>
    ) : null;
  }

  function description(field: ReviewField, hint?: string) {
    return (
      [hint, errors[field] ? `review-${field}-error` : ""].filter(Boolean).join(" ") || undefined
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    const input = Object.fromEntries(data);
    const checked = validateReview(input);
    if (!checked.ok) {
      setErrors(checked.errors);
      setResult({
        ok: false,
        message: "Please check the highlighted fields.",
        errors: checked.errors,
      });
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
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(18000),
      });
      const value: unknown = await response.json();
      if (
        !value ||
        typeof value !== "object" ||
        !("ok" in value) ||
        typeof value.ok !== "boolean" ||
        !("message" in value) ||
        typeof value.message !== "string"
      )
        throw new Error("Invalid response");
      const next = value as ReviewResult;
      if (response.ok && next.ok) setResult({ ok: true, message: next.message });
      else {
        setErrors(next.errors ?? {});
        setResult({ ...next, ok: false });
      }
    } catch {
      setResult({
        ok: false,
        message: "We could not confirm your review was sent. Please try again or call the office.",
      });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="review-success" role="status" tabIndex={-1} ref={status}>
        <h3>Thank you for sharing.</h3>
        <p>{result.message}</p>
        <p>
          If you did not give permission to publish, your comments will remain private feedback for
          the office.
        </p>
      </div>
    );
  }

  return (
    <form
      action="/api/reviews"
      method="post"
      noValidate
      onSubmit={submit}
      aria-busy={pending}
      onBlur={(event) => validateField(event.target)}
      onChange={(event) => {
        const target = event.target;
        if ("name" in target && errors[target.name as ReviewField]) validateField(target);
        if (result) setResult(null);
      }}
    >
      <p className="review-privacy-note" id="review-privacy">
        Please leave out case numbers, documents, other people’s names and confidential details. For
        help with an ongoing matter, <Link href="/contact">contact the office</Link>.
      </p>
      <noscript>
        <p>
          Your review can be submitted without JavaScript. You will receive a confirmation page
          after sending.
        </p>
      </noscript>
      {result ? (
        <div className="form-status" role="alert" tabIndex={-1} ref={status}>
          <p>{result.message}</p>
          {!result.errors ? (
            <p>
              Need help? Call <a href={site.phones.primary.href}>{site.phones.primary.display}</a>{" "}
              or <a href={site.phones.office.href}>{site.phones.office.display}</a>.
            </p>
          ) : null}
        </div>
      ) : null}
      <div hidden aria-hidden="true">
        <label htmlFor="review-website">Leave this field blank</label>
        <input id="review-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <fieldset className="review-fields" disabled={pending}>
        <legend className="sr-only">Your review</legend>
        <div className="review-form-grid">
          <div className="field">
            <label htmlFor="review-displayName">
              Display name <span aria-hidden="true">*</span>
            </label>
            <input
              className="input"
              id="review-displayName"
              name="displayName"
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={80}
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={description("displayName", "review-name-hint")}
            />
            <small id="review-name-hint">
              Use the name or initials you want displayed, such as Sam R.
            </small>
            {error("displayName")}
          </div>
          <div className="field">
            <label htmlFor="review-email">
              Email address <span aria-hidden="true">*</span>
            </label>
            <input
              className="input"
              id="review-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={description("email", "review-email-hint")}
            />
            <small id="review-email-hint">
              For private follow-up only. Never displayed with your review.
            </small>
            {error("email")}
          </div>
        </div>
        <fieldset
          className="review-rating"
          aria-describedby={description("rating", "review-rating-hint")}
        >
          <legend>
            Your rating <span aria-hidden="true">*</span>
          </legend>
          <small id="review-rating-hint">1 = poor · 5 = excellent</small>
          <div className="review-rating-options">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label className="review-rating-option" key={rating}>
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  required
                  aria-describedby={description("rating")}
                />
                <span>
                  {rating}
                  <span className="sr-only"> out of 5</span>
                </span>
                <span aria-hidden="true">★</span>
              </label>
            ))}
          </div>
          {error("rating")}
        </fieldset>
        <div className="field">
          <label htmlFor="review-text">
            Your review <span aria-hidden="true">*</span>
          </label>
          <textarea
            className="input"
            id="review-text"
            name="text"
            required
            minLength={10}
            maxLength={1500}
            rows={5}
            aria-invalid={Boolean(errors.text)}
            aria-describedby={description("text", "review-privacy review-text-hint")}
          />
          <small id="review-text-hint">
            10–1,500 characters. Tell us about communication, clarity or your overall experience.
          </small>
          {error("text")}
        </div>
        <label className="checkbox-label review-checkbox" htmlFor="review-genuine">
          <input
            type="checkbox"
            id="review-genuine"
            name="genuine"
            required
            aria-invalid={Boolean(errors.genuine)}
            aria-describedby={description("genuine")}
          />
          <span>
            This review reflects my own genuine experience with the practice.{" "}
            <span aria-hidden="true">*</span>
          </span>
        </label>
        {error("genuine")}
        <label className="checkbox-label review-checkbox" htmlFor="review-permission">
          <input
            type="checkbox"
            id="review-permission"
            name="permissionToPublish"
            aria-describedby="review-permission-hint"
          />
          <span>
            The practice may publish my review, rating and display name on this website.{" "}
            <span className="field-optional">(optional)</span>
          </span>
        </label>
        <p className="form-note" id="review-permission-hint">
          Leave this unchecked to send private feedback only. Nothing is published automatically.
        </p>
        <p className="form-note">
          Read our <Link href="/privacy-policy">Privacy Policy</Link>. Required fields are marked *.
        </p>
        <button type="submit" className="button button-primary">
          {pending ? "Sending your review…" : "Send your review"}
        </button>
      </fieldset>
    </form>
  );
}
