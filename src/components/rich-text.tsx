import Link from "next/link";
import type { ReactNode } from "react";

/** Small, deliberately limited Markdown renderer. It never accepts raw HTML. */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\)|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={index}>{part.slice(2, -2)}</strong>;

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);

    if (link && /^(\/|https:\/\/|tel:|mailto:)/.test(link[2])) {
      return (
        <Link key={index} href={link[2]}>
          {link[1]}
        </Link>
      );
    }

    if (part.startsWith("`") && part.endsWith("`"))
      return <span key={index}>{part.slice(1, -1)}</span>;

    return part;
  });
}

export function RichText({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((paragraph, index) => {
    const lines = paragraph.split("\n");

    if (lines.every((line) => /^- /.test(line))) {
      return (
        <ul key={index}>
          {lines.map((line, item) => (
            <li key={item}>{inline(line.slice(2))}</li>
          ))}
        </ul>
      );
    }

    if (lines.every((line) => /^\d+\. /.test(line))) {
      return (
        <ol key={index}>
          {lines.map((line, item) => (
            <li key={item}>{inline(line.replace(/^\d+\. /, ""))}</li>
          ))}
        </ol>
      );
    }

    return <p key={index}>{inline(lines.join(" "))}</p>;
  });
}
