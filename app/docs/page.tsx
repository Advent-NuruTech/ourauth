import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ants API Reference",
  description: "Interactive API reference for the Ants authentication service.",
};

/**
 * Renders the OpenAPI spec (public/openapi.yaml) with Scalar's API reference.
 * The library is loaded client-side from a CDN, so the build never needs network
 * access. If the CDN is unreachable, the link below still points to the raw spec.
 */
export default function DocsPage() {
  return (
    <>
      <noscript>
        <p style={{ padding: 24 }}>
          Enable JavaScript to view the interactive docs, or open{" "}
          <a href="/openapi.yaml">/openapi.yaml</a>.
        </p>
      </noscript>
      {/* Scalar reads this element's data-url to find the spec. */}
      <script
        id="api-reference"
        data-url="/openapi.yaml"
        dangerouslySetInnerHTML={{ __html: "" }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
        strategy="afterInteractive"
      />
    </>
  );
}
