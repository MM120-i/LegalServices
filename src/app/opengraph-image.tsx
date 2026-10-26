import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.business.name} — Licensed paralegal in Scarborough, Toronto`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f5f2eb",
        color: "#193b35",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, letterSpacing: 6 }}>
        {site.business.name.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 70, lineHeight: 1.05, maxWidth: 950 }}>
          A clearer next step for your legal matter.
        </div>
        <div style={{ fontSize: 25, marginTop: 16 }}>Licensed paralegal · Scarborough, Toronto</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #c6cec4",
          paddingTop: 24,
          fontSize: 23,
        }}
      >
        <span>{site.business.principal}</span>
        <span>{site.phones.primary.display}</span>
      </div>
    </div>,
    size,
  );
}
