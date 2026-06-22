import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Ants" };

const UPDATED = "22 June 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: {UPDATED}</p>
      <p>
        This Privacy Policy explains how Ants (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses,
        and protects personal data when you use our authentication platform (the
        &ldquo;Service&rdquo;). It covers two roles: developers who hold an Ants account, and the end
        users who authenticate through applications built on Ants.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data (developers):</strong> name, email address, and a securely hashed
          password. If you sign in with Google, we receive your Google account identifier, email,
          name, and profile picture.
        </li>
        <li>
          <strong>End-user data (on behalf of developers):</strong> identifiers, email, name, avatar,
          and authentication events for users of applications that integrate Ants.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, user agent, timestamps, and audit/security
          logs needed to operate and protect the Service.
        </li>
      </ul>

      <h2>2. How we use data</h2>
      <ul>
        <li>to provide authentication, session management, and account features;</li>
        <li>to secure the Service, detect abuse, and maintain audit trails;</li>
        <li>to communicate service-related notices; and</li>
        <li>to comply with legal obligations.</li>
      </ul>

      <h2>3. Roles: controller and processor</h2>
      <p>
        For developer account data, Ants acts as a data controller. For end-user data processed
        through your application, Ants acts as a processor on behalf of you, the developer, who is
        the controller. You are responsible for having a lawful basis and appropriate notices for
        your end users.
      </p>

      <h2>4. Sign in with Google</h2>
      <p>
        When you choose &ldquo;Continue with Google&rdquo;, Google shares the basic profile
        information described above so we can create or link your Ants account. We request only the
        <code> openid</code>, <code> email</code>, and <code> profile</code> scopes. We do not post
        to your Google account or access any other Google data. Your use of Google sign-in is also
        subject to Google&rsquo;s privacy policy.
      </p>

      <h2>5. Sharing</h2>
      <p>
        We do not sell personal data. We share data only with infrastructure sub-processors that help
        us run the Service (for example, hosting and database providers), under appropriate
        contractual safeguards, and when required by law.
      </p>

      <h2>6. Retention</h2>
      <p>
        We keep personal data for as long as your account is active or as needed to provide the
        Service, then delete or anonymize it after a reasonable period, subject to legal
        requirements.
      </p>

      <h2>7. Security</h2>
      <p>
        We protect data with encryption in transit and at rest, hashed passwords, scoped API keys,
        and least-privilege access controls. No system is perfectly secure, but we work to protect
        your information.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, export, or delete
        your personal data, and to object to or restrict certain processing. To exercise these
        rights, contact us at the address below. End users should contact the developer operating the
        application they use.
      </p>

      <h2>9. Cookies</h2>
      <p>
        We use strictly necessary cookies to keep you signed in and to secure the Service. See our{" "}
        <a href="/legal/cookies">Cookie Policy</a> for details.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy questions or requests, contact{" "}
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
