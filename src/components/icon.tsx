import type { SVGProps } from "react";

const paths: Record<string, React.ReactNode> = {
  "arrow-right": (
    <>
      <path d="M4 12h15M13 5l7 7-7 7" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M5 19 19 5M5 5h14v14" />
    </>
  ),
  phone: (
    <path d="m5 3 4 1 1 5-3 2a16 16 0 0 0 6 6l2-3 5 1 1 4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z" />
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  car: (
    <>
      <path d="m4 10 2-6h12l2 6M3 10h18v9H3zM5 19v2m14-2v2M7 14h1m8 0h1" />
    </>
  ),
  heart: (
    <>
      <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 4 1 9 8 15 7-6 12-11 8-15Z" />
      <path d="M4 12h4l2-4 3 7 2-3h5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18M5 6h14M5 18h14" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-8 9 8M5 9v12h14V9M9 21v-8h6v8" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V3h8v4M3 12l9 3 9-3M12 12v5" />
    </>
  ),
  document: (
    <>
      <path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8M8 19h5" />
    </>
  ),
  pen: (
    <>
      <path d="m4 15-1 6 6-1L21 8l-5-5L4 15ZM13 6l5 5M4 15l5 5" />
    </>
  ),
  facebook: (
    <path
      d="M14 21v-8h3l.5-3H14V8c0-1 .4-2 2-2h2V3h-3c-3 0-5 2-5 5v2H7v3h3v8Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  linkedin: (
    <>
      <path
        d="M4 9h3v11H4zm6 0h3v1.5c.8-1.1 2-1.8 3.5-1.8 3 0 4.5 1.8 4.5 5V20h-3v-6c0-1.6-.7-2.5-2.1-2.5-1.7 0-2.9 1.1-2.9 2.8V20h-3Z"
        fill="currentColor"
        stroke="none"
      />
      <circle cx="5.5" cy="5.5" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="m5 5 14 14M5 19 19 5" />,
  plus: <path d="M12 4v16M4 12h16" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  quote: (
    <>
      <path d="M10 5H4v7h5c0 4-2 6-5 7M21 5h-6v7h5c0 4-2 6-5 7" />
    </>
  ),
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] ?? paths["arrow-right"]}
    </svg>
  );
}
