import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — Ants" };

const UPDATED = "22 June 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>Last updated: {UPDATED}</p>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Ants
        authentication platform, including the dashboard, APIs, SDKs, and related services
        (collectively, the &ldquo;Service&rdquo;) provided by Ants (&ldquo;Ants&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using the Service, you agree
        to these Terms. If you are using the Service on behalf of an organization, you represent
        that you have authority to bind that organization.
      </p>

      <h2>1. Accounts</h2>
      <p>
        You may create an account using an email and password or by signing in with Google. You are
        responsible for safeguarding your credentials and for all activity under your account. You
        must provide accurate information and be at least the age of majority in your jurisdiction.
        Notify us promptly of any unauthorized use.
      </p>

      <h2>2. The Service</h2>
      <p>
        Ants provides authentication and user-management infrastructure that you integrate into your
        own applications. You are responsible for your applications, for the lawful basis of
        processing your end users&rsquo; data, and for configuring the Service appropriately
        (including redirect URLs, allowed origins, and sign-in methods).
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to, and not to permit anyone to:</p>
      <ul>
        <li>use the Service to violate any law or infringe any third party&rsquo;s rights;</li>
        <li>attempt to gain unauthorized access to the Service or its related systems;</li>
        <li>probe, scan, or test the vulnerability of the Service without authorization;</li>
        <li>interfere with or disrupt the integrity or performance of the Service;</li>
        <li>resell or sublicense the Service except as expressly permitted; or</li>
        <li>send spam, malware, or use the Service to harvest data unlawfully.</li>
      </ul>

      <h2>4. Customer data</h2>
      <p>
        You retain all rights to the data you and your end users submit to the Service
        (&ldquo;Customer Data&rdquo;). You grant us a limited license to process Customer Data solely
        to provide and secure the Service. Our handling of personal data is described in our{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2>5. Fees</h2>
      <p>
        Paid plans, if any, are billed as described at sign-up or on our pricing page. Fees are
        non-refundable except where required by law. We may change pricing on prospective notice.
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        We strive to keep the Service available but do not guarantee uninterrupted operation. We may
        modify, suspend, or discontinue features, and we may update these Terms; material changes
        will be communicated through the Service or by email. Continued use after changes take
        effect constitutes acceptance.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you breach
        these Terms or if required for security or legal reasons. Upon termination, your right to use
        the Service ceases and we may delete Customer Data after a reasonable retention period.
      </p>

      <h2>8. Disclaimers and limitation of liability</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind to the maximum
        extent permitted by law. To the fullest extent permitted by law, Ants will not be liable for
        indirect, incidental, or consequential damages, and our total liability for any claim is
        limited to the amounts you paid for the Service in the twelve months preceding the claim.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these Terms? Contact{" "}
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
