"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

export function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="faq-item">
      <button
        type="button"
        className="faq-trigger"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{question}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div
        className="faq-answer prose"
        id={`${id}-panel`}
        aria-labelledby={`${id}-trigger`}
        hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
