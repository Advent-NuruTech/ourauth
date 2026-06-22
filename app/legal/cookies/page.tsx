import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy — Ants" };

const UPDATED = "22 June 2026";

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p>Last updated: {UPDATED}</p>
      <p>
        This Cookie Policy explains how Ants uses cookies and similar technologies on the Ants
        dashboard and website. It should be read together with our{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What cookies are</h2>
      <p>
        Cookies are small text files stored on your device by your browser. They let a site remember
        your actions and preferences (such as staying signed in) over time.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li>
          <strong>Strictly necessary &mdash; session:</strong> <code>ants_dev_session</code> and{" "}
          <code>ants_platform_session</code> are secure, <code>httpOnly</code> cookies that keep you
          signed in to the dashboard. The Service cannot function without them.
        </li>
        <li>
          <strong>Strictly necessary &mdash; security:</strong> short-lived state used during the
          &ldquo;Continue with Google&rdquo; flow to prevent cross-site request forgery.
        </li>
      </ul>
      <p>
        We do not use advertising or third-party tracking cookies. Because the cookies above are
        strictly necessary to deliver a service you have requested, they do not require consent under
        most privacy laws.
      </p>

      <h2>3. Managing cookies</h2>
      <p>
        You can block or delete cookies through your browser settings. Note that blocking the
        strictly necessary cookies will prevent you from signing in to or using the dashboard.
      </p>

      <h2>4. Changes</h2>
      <p>
        We may update this Cookie Policy as the Service evolves. We will post the revised version
        here with a new &ldquo;last updated&rdquo; date.
      </p>

      <h2>5. Contact</h2>
      <p>
        Questions about cookies? Contact{" "}
        <a href="mailto:adventnurutech@gmail.com">adventnurutech@gmail.com</a>.
      </p>

      <p>
        <em>
          This document is a general template and not legal advice. Have it reviewed by qualified
          counsel before relying on it in production.
        </em>
      </p>
    </>
  );
}
