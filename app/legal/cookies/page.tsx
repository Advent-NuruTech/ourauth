import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Ants",
  description:
    "How Ants uses cookies and similar technologies, the specific cookies we set, their purpose and duration, and how to manage them.",
};

const UPDATED = "22 June 2026";
const EFFECTIVE = "22 June 2026";

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p>
        Last updated: {UPDATED} &middot; Effective: {EFFECTIVE}
      </p>
      <p>
        This Cookie Policy explains how Ants (&ldquo;Ants&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
        uses cookies and similar technologies on the Ants dashboard and website (the
        &ldquo;Service&rdquo;). It should be read together with our{" "}
        <a href="/legal/privacy">Privacy Policy</a>, which explains how we handle personal data more
        generally.
      </p>

      <h2>1. What cookies and similar technologies are</h2>
      <p>
        Cookies are small text files that a website stores on your device through your browser. They
        allow a site to remember your actions and preferences (such as keeping you signed in) over
        time. &ldquo;Similar technologies&rdquo; include local storage, session storage, and pixels,
        which can be used for comparable purposes. Cookies may be{" "}
        <strong>first-party</strong> (set by Ants) or <strong>third-party</strong> (set by another
        domain), and either <strong>session</strong> cookies (deleted when you close your browser) or{" "}
        <strong>persistent</strong> cookies (which remain until they expire or are deleted).
      </p>

      <h2>2. How we use cookies</h2>
      <p>
        We use cookies strictly to operate and secure the Service &mdash; principally to keep you
        signed in and to protect authentication flows against abuse. We do{" "}
        <strong>not</strong> use advertising, analytics, or third-party tracking cookies, and we do
        not use cookies to build advertising profiles or to track you across other websites.
      </p>

      <h2>3. Cookies we set</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Category</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>ants_dev_session</code>
            </td>
            <td>Strictly necessary</td>
            <td>
              Secure, <code>httpOnly</code> cookie that keeps a Developer signed in to the dashboard.
            </td>
            <td>Session / on expiry</td>
          </tr>
          <tr>
            <td>
              <code>ants_platform_session</code>
            </td>
            <td>Strictly necessary</td>
            <td>
              Secure, <code>httpOnly</code> cookie that maintains the authenticated platform session.
            </td>
            <td>Session / on expiry</td>
          </tr>
          <tr>
            <td>OAuth state / CSRF token</td>
            <td>Strictly necessary &mdash; security</td>
            <td>
              Short-lived value used during the &ldquo;Continue with Google&rdquo; flow to prevent
              cross-site request forgery.
            </td>
            <td>A few minutes</td>
          </tr>
        </tbody>
      </table>
      <p>
        Exact cookie names and durations may change as the Service evolves; the categories and
        purposes above describe how we use them.
      </p>

      <h2>4. Consent</h2>
      <p>
        The cookies we use are <strong>strictly necessary</strong> to deliver a service you have
        actively requested (signing in and using the dashboard). Under most privacy laws, including
        the EU/UK ePrivacy rules, strictly necessary cookies do not require consent. Because we do not
        use non-essential, advertising, or analytics cookies, we do not display a cookie consent
        banner. If this changes in the future, we will request consent where required.
      </p>

      <h2>5. Managing cookies</h2>
      <p>
        You can control and delete cookies through your browser settings, and most browsers let you
        block cookies or alert you when one is set. Please note that blocking the strictly necessary
        cookies listed above will prevent you from signing in to or using the dashboard. Guidance for
        common browsers:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/help/4027947"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>

      <h2>6. Changes to this Cookie Policy</h2>
      <p>
        We may update this Cookie Policy as the Service evolves or as required by law. We will post the
        revised version here with a new &ldquo;Last updated&rdquo; date and, where appropriate, provide
        additional notice.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about cookies? Contact us at{" "}
        <a href="mailto:adventnurutech@gmail.com">adventnurutech@gmail.com</a>.
      </p>

     
    </>
  );
}
