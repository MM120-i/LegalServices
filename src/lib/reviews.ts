import { isEmail } from "./contact.ts";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewField = "displayName" | "email" | "rating" | "text" | "genuine";
export type ReviewErrors = Partial<Record<ReviewField, string>>;

export interface ReviewSubmission {
  displayName: string;
  email: string;
  rating: ReviewRating;
  text: string;
  genuine: true;
  permissionToPublish: boolean;
}

export interface ReviewResult {
  ok: boolean;
  message: string;
  errors?: ReviewErrors;
}

export const reviewReceivedMessage =
  "Thank you. Your review has been sent to the office for review. It has not been published. Your email address will stay private.";

export function validateReview(
  input: Record<string, unknown>,
): { ok: true; value: ReviewSubmission } | { ok: false; errors: ReviewErrors } {
  const read = (key: string) => (typeof input[key] === "string" ? input[key].trim() : "");
  const checked = (key: string) => input[key] === true || input[key] === "on";
  const displayName = read("displayName");
  const email = read("email");
  const text = read("text");
  const rating = input.rating;
  const errors: ReviewErrors = {};

  if (
    displayName.length < 2 ||
    displayName.length > 80 ||
    !/^[\p{L}\p{M} .'’ʼ·-]+$/u.test(displayName) ||
    !/\p{L}/u.test(displayName)
  ) {
    errors.displayName = "Enter a name or initials using 2–80 characters.";
  }

  if (!isEmail(email))
    errors.email = "Enter your email address so the office can follow up privately.";

  if (!["1", "2", "3", "4", "5", 1, 2, 3, 4, 5].includes(rating as string | number))
    errors.rating = "Choose a rating from 1 to 5.";

  if (
    text.length < 10 ||
    text.length > 1500 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)
  ) {
    errors.text = "Write 10–1,500 characters about your experience, without private case details.";
  }

  if (!checked("genuine")) {
    errors.genuine = "Please confirm this is your own genuine experience.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      displayName: displayName.normalize("NFC").replace(/ +/g, " "),
      email,
      rating: Number(rating) as ReviewRating,
      text,
      genuine: true,
      permissionToPublish: checked("permissionToPublish"),
    },
  };
}
