import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Ants",
  description:
    "How Ants collects, uses, shares, and protects personal data across its authentication platform, including GDPR, UK GDPR, and CCPA/CPRA disclosures.",
};

const UPDATED = "22 June 2026";
const EFFECTIVE = "22 June 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        Last updated: {UPDATED} &middot; Effective: {EFFECTIVE}
      </p>
      <p>
        This Privacy Policy (&ldquo;Policy&rdquo;) explains how Ants (&ldquo;Ants&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, discloses, and
        safeguards personal data when you access or use our authentication and user-management
        platform, including the dashboard, APIs, SDKs, documentation, and related websites and
        services (collectively, the &ldquo;Service&rdquo;). It also describes the rights and choices
        available to you regarding your personal data.
      </p>
      <p>
        The Service involves two distinct audiences, and this Policy addresses both:
      </p>
      <ul>
        <li>
          <strong>Developers</strong> &mdash; individuals or organizations that hold an Ants account
          and integrate the Service into their own applications; and
        </li>
        <li>
          <strong>End users</strong> &mdash; individuals who authenticate through applications built
          by Developers on the Ants platform.
        </li>
      </ul>
      <p>
        Please read this Policy together with our{" "}
        <a href="/legal/terms">Terms of Service</a> and our{" "}
        <a href="/legal/cookies">Cookie Policy</a>.
      </p>

      <h2>1. Who is responsible for your data (controller / processor)</h2>
      <p>
        Data-protection law distinguishes between a <strong>controller</strong> (who decides why and
        how personal data is processed) and a <strong>processor</strong> (who processes data on the
        controller&rsquo;s instructions). Ants&rsquo; role depends on the data in question:
      </p>
      <ul>
        <li>
          <strong>For Developer account data,</strong> Ants is the <strong>controller</strong>. This
          Policy is our notice to you for that data.
        </li>
        <li>
          <strong>For End-user data processed through a Developer&rsquo;s application,</strong> Ants
          acts as a <strong>processor</strong> on behalf of the Developer, who is the controller.
          The Developer is responsible for establishing a lawful basis, providing privacy notices,
          and handling rights requests for its end users. End users should direct privacy requests to
          the Developer operating the application they use.
        </li>
      </ul>
      <p>
        Where Ants acts as a processor, our processing is governed by the agreement (including any
        Data Processing Addendum) between Ants and the relevant Developer.
      </p>

      <h2>2. Personal data we collect</h2>
      <h3>2.1 Data you provide directly (Developers)</h3>
      <ul>
        <li>
          <strong>Account and profile data:</strong> name, email address, and a securely hashed
          password. If you sign in with Google, we receive your Google account identifier, email
          address, name, and profile picture.
        </li>
        <li>
          <strong>Organization and configuration data:</strong> organization or project names,
          environments, team members, roles and permissions, application settings (such as redirect
          URLs and allowed origins), and API keys you generate.
        </li>
        <li>
          <strong>Support and communications:</strong> the contents of messages you send us and any
          information you choose to include.
        </li>
        <li>
          <strong>Billing data (paid plans, if any):</strong> billing contact details and
          transaction records. Card details are handled by our payment processor; we do not store
          full card numbers.
        </li>
      </ul>
      <h3>2.2 End-user data (processed on behalf of Developers)</h3>
      <ul>
        <li>
          identifiers, email address, name, and avatar of the Developer&rsquo;s end users;
        </li>
        <li>
          authentication events, session records, and role/permission assignments; and
        </li>
        <li>
          any additional attributes the Developer chooses to store via the Service.
        </li>
      </ul>
      <h3>2.3 Data collected automatically</h3>
      <ul>
        <li>
          <strong>Technical and device data:</strong> IP address, browser and device type, user
          agent, and operating system.
        </li>
        <li>
          <strong>Usage and log data:</strong> timestamps, requests made, features used, and
          diagnostic data.
        </li>
        <li>
          <strong>Security and audit data:</strong> sign-in attempts, audit trails, and abuse- and
          fraud-detection signals needed to operate and protect the Service.
        </li>
        <li>
          <strong>Cookies and similar technologies:</strong> as described in our{" "}
          <a href="/legal/cookies">Cookie Policy</a>.
        </li>
      </ul>
      <p>
        We do not intentionally collect special categories of personal data (such as health,
        biometric, or political data) and ask that you do not submit such data through the Service.
      </p>

      <h2>3. How we use personal data</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>provide, operate, and maintain authentication, session management, and account features;</li>
        <li>create, secure, and administer Developer accounts and organizations;</li>
        <li>secure the Service, prevent and detect fraud and abuse, and maintain audit trails;</li>
        <li>provide customer support and respond to your requests;</li>
        <li>send service-related and administrative communications;</li>
        <li>monitor, analyze, and improve the Service and develop new features;</li>
        <li>process payments and manage billing (where applicable); and</li>
        <li>comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2>4. Legal bases for processing (EEA / UK)</h2>
      <p>
        If you are in the European Economic Area or the United Kingdom, we rely on the following
        legal bases under the GDPR and UK GDPR when we act as a controller:
      </p>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Providing and administering your account and the Service</td>
            <td>Performance of a contract (Art. 6(1)(b))</td>
          </tr>
          <tr>
            <td>Security, fraud prevention, audit logging, and improving the Service</td>
            <td>Legitimate interests (Art. 6(1)(f))</td>
          </tr>
          <tr>
            <td>Service and administrative communications</td>
            <td>Performance of a contract / legitimate interests</td>
          </tr>
          <tr>
            <td>Complying with legal obligations (e.g., tax, security)</td>
            <td>Legal obligation (Art. 6(1)(c))</td>
          </tr>
          <tr>
            <td>Optional communications where required by law</td>
            <td>Consent (Art. 6(1)(a)), which you may withdraw at any time</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Sign in with Google</h2>
      <p>
        When you choose &ldquo;Continue with Google&rdquo;, Google shares the basic profile
        information described in Section 2 so we can create or link your Ants account. We request only
        the <code>openid</code>, <code>email</code>, and <code>profile</code> scopes. We do not post
        to your Google account or access any other Google data. Ants&rsquo; use and transfer of
        information received from Google APIs adheres to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Your use of Google sign-in is also subject to{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&rsquo;s Privacy Policy
        </a>
        .
      </p>

      <h2>6. How we share personal data</h2>
      <p>
        We do <strong>not</strong> sell personal data, and we do not share personal data for
        cross-context behavioral advertising. We disclose personal data only as described below:
      </p>
      <ul>
        <li>
          <strong>Sub-processors and service providers</strong> that help us run the Service (for
          example, hosting, database, email delivery, and payment processing), under contracts that
          require appropriate confidentiality and security safeguards.
        </li>
        <li>
          <strong>With the relevant Developer,</strong> where we act as a processor for end-user data.
        </li>
        <li>
          <strong>Legal and safety:</strong> when required by law, regulation, legal process, or
          governmental request, or to protect the rights, property, or safety of Ants, our users, or
          others.
        </li>
        <li>
          <strong>Business transfers:</strong> in connection with a merger, acquisition, financing,
          or sale of assets, subject to this Policy.
        </li>
      </ul>

      <h2>7. International data transfers</h2>
      <p>
        We may process and store personal data in countries other than the one in which you reside.
        Where we transfer personal data out of the EEA, the UK, or Switzerland to a country without an
        adequacy decision, we rely on appropriate safeguards such as the European Commission&rsquo;s
        Standard Contractual Clauses (and the UK Addendum where applicable), together with
        supplementary measures as needed.
      </p>

      <h2>8. Data retention</h2>
      <p>
        We retain personal data for as long as your account is active or as needed to provide the
        Service, and thereafter only as necessary to comply with legal obligations, resolve disputes,
        prevent fraud and abuse, and enforce our agreements. When personal data is no longer required,
        we delete or anonymize it. Security and audit logs are retained for a limited period
        appropriate to their purpose. For end-user data processed on a Developer&rsquo;s behalf,
        retention is governed by the Developer&rsquo;s instructions and configuration.
      </p>

      <h2>9. Security</h2>
      <p>
        We maintain technical and organizational measures designed to protect personal data,
        including encryption in transit and at rest, password hashing, scoped API keys,
        least-privilege access controls, secure session cookies, and monitoring and audit logging. No
        method of transmission or storage is completely secure; while we work to protect your
        information, we cannot guarantee absolute security. If we become aware of a personal data
        breach that affects you, we will notify you and the relevant authorities as required by
        applicable law.
      </p>

      <h2>10. Your privacy rights</h2>
      <h3>10.1 EEA / UK (GDPR)</h3>
      <p>
        Subject to applicable law, you have the right to access, rectify, erase, restrict, or object
        to processing of your personal data; the right to data portability; and the right to withdraw
        consent where processing is based on consent. You also have the right to lodge a complaint
        with your local supervisory authority.
      </p>
      <h3>10.2 California (CCPA/CPRA)</h3>
      <p>
        If you are a California resident, you may have the right to know and access the personal
        information we collect, to request deletion or correction, and to opt out of the
        &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information. We do not sell or share
        personal information as those terms are defined under the CPRA. You have the right not to
        receive discriminatory treatment for exercising your rights.
      </p>
      <h3>10.3 How to exercise your rights</h3>
      <p>
        To exercise these rights, contact us using the details in Section 14. We will verify your
        request and respond within the timeframes required by applicable law. You may use an
        authorized agent where permitted. <strong>End users</strong> of a Developer&rsquo;s
        application should direct requests to that Developer, who is the controller of their data; we
        will assist the Developer as their processor.
      </p>

      <h2>11. Children&rsquo;s privacy</h2>
      <p>
        The Service is not directed to children, and we do not knowingly collect personal data from
        children under the age required by applicable law (for example, 16 in the EEA or 13 in the
        United States) without appropriate consent. If you believe a child has provided us personal
        data, please contact us and we will take appropriate steps to delete it.
      </p>

      <h2>12. Cookies and similar technologies</h2>
      <p>
        We use strictly necessary cookies to keep you signed in and to secure the Service. We do not
        use advertising or third-party tracking cookies. For full details, see our{" "}
        <a href="/legal/cookies">Cookie Policy</a>.
      </p>

      <h2>13. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. When we make material changes, we will revise the
        &ldquo;Last updated&rdquo; date above and, where appropriate, provide additional notice
        through the Service or by email. Your continued use of the Service after the changes take
        effect constitutes acceptance of the updated Policy.
      </p>

      <h2>14. Contact us</h2>
      <p>
        For privacy questions, requests, or to exercise your rights, contact us at{" "}
        <a href="mailto:adventnurutech@gmail.com">adventnurutech@gmail.com</a>. If we are unable to
        resolve your concern, you may have the right to contact your local data-protection authority.
      </p>

      
    </>
  );
}
