import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Ants",
  description:
    "The legal terms governing access to and use of the Ants authentication platform, including accounts, acceptable use, data, liability, and dispute resolution.",
};

const UPDATED = "22 June 2026";
const EFFECTIVE = "22 June 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>
        Last updated: {UPDATED} &middot; Effective: {EFFECTIVE}
      </p>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) are a binding agreement between you and Ants
        (&ldquo;Ants&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) and govern your
        access to and use of the Ants authentication and user-management platform, including the
        dashboard, APIs, SDKs, documentation, and related services (collectively, the
        &ldquo;Service&rdquo;). By creating an account, accessing, or using the Service, you agree to
        these Terms and to our <a href="/legal/privacy">Privacy Policy</a> and{" "}
        <a href="/legal/cookies">Cookie Policy</a>. If you do not agree, do not use the Service.
      </p>
      <p>
        If you use the Service on behalf of an organization, you represent and warrant that you have
        authority to bind that organization to these Terms, and &ldquo;you&rdquo; refers to that
        organization.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>&ldquo;Developer&rdquo;</strong> means the account holder who integrates the Service
          into its own applications.
        </li>
        <li>
          <strong>&ldquo;End User&rdquo;</strong> means an individual who authenticates through a
          Developer&rsquo;s application.
        </li>
        <li>
          <strong>&ldquo;Customer Data&rdquo;</strong> means data submitted to the Service by or on
          behalf of a Developer or its End Users.
        </li>
      </ul>

      <h2>2. Eligibility and accounts</h2>
      <p>
        You must be at least the age of majority in your jurisdiction to use the Service. You may
        create an account using an email and password or by signing in with Google. You agree to
        provide accurate and complete information and to keep it up to date. You are responsible for
        safeguarding your credentials and API keys and for all activity that occurs under your
        account. Notify us promptly at the address in Section 15 of any unauthorized use or suspected
        security breach.
      </p>

      <h2>3. The Service</h2>
      <p>
        Ants provides authentication and user-management infrastructure that you integrate into your
        own applications. You are solely responsible for your applications, for establishing a lawful
        basis for processing your End Users&rsquo; data, for providing your End Users with required
        notices and obtaining any necessary consents, and for configuring the Service appropriately
        (including redirect URLs, allowed origins, roles, permissions, environments, and sign-in
        methods).
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to, and not to permit anyone to:</p>
      <ul>
        <li>use the Service to violate any law or infringe any third party&rsquo;s rights;</li>
        <li>attempt to gain unauthorized access to the Service or its related systems or networks;</li>
        <li>probe, scan, or test the vulnerability of the Service without our prior written authorization;</li>
        <li>interfere with or disrupt the integrity or performance of the Service;</li>
        <li>reverse engineer, decompile, or attempt to derive source code, except where such restriction is prohibited by law;</li>
        <li>resell, sublicense, or provide the Service to third parties except as expressly permitted;</li>
        <li>circumvent usage limits, rate limits, or access controls; or</li>
        <li>send spam or malware, or use the Service to harvest data unlawfully.</li>
      </ul>
      <p>
        We may suspend or limit access to investigate suspected violations or to protect the security
        and integrity of the Service.
      </p>

      <h2>5. Customer Data and privacy</h2>
      <p>
        As between the parties, you retain all rights to Customer Data. You grant us a worldwide,
        non-exclusive license to host, process, transmit, and display Customer Data solely as
        necessary to provide, secure, and support the Service. You represent that you have all rights
        and consents necessary to submit Customer Data and to authorize our processing of it. Our
        handling of personal data is described in our <a href="/legal/privacy">Privacy Policy</a>;
        where Ants processes End-User personal data on your behalf, we do so as your processor.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The Service, including all software, documentation, and content provided by Ants (excluding
        Customer Data), is owned by Ants or its licensors and is protected by intellectual property
        laws. Subject to these Terms, we grant you a limited, non-exclusive, non-transferable,
        revocable right to access and use the Service. We reserve all rights not expressly granted. If
        you provide feedback or suggestions, you grant us a perpetual, royalty-free license to use it
        without restriction.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The Service may interoperate with third-party services (such as Google sign-in or hosting
        providers). Your use of those services is governed by their own terms and privacy policies,
        and we are not responsible for them.
      </p>

      <h2>8. Fees and payment</h2>
      <p>
        Paid plans, if any, are billed as described at sign-up or on our pricing page. Unless stated
        otherwise, fees are exclusive of taxes, are non-refundable except where required by law, and
        are due in advance. We may change pricing on prospective notice; changes will not apply
        retroactively to a period already paid for. Failure to pay may result in suspension or
        termination.
      </p>

      <h2>9. Availability, changes, and beta features</h2>
      <p>
        We strive to keep the Service available but do not guarantee uninterrupted or error-free
        operation. We may modify, suspend, or discontinue features at any time. Features designated as
        beta, preview, or experimental are provided &ldquo;as is&rdquo; and may be changed or removed
        without notice. We may update these Terms from time to time; material changes will be
        communicated through the Service or by email, and your continued use after the changes take
        effect constitutes acceptance.
      </p>

      <h2>10. Term and termination</h2>
      <p>
        These Terms apply while you use the Service. You may stop using the Service and close your
        account at any time. We may suspend or terminate your access if you breach these Terms, fail
        to pay applicable fees, or where required for security, legal, or operational reasons. Upon
        termination, your right to use the Service ceases. We may delete Customer Data after a
        reasonable retention period; you are responsible for exporting Customer Data before
        termination where such functionality is available. Sections that by their nature should
        survive termination (including Sections 5&ndash;6 and 11&ndash;14) will survive.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        To the maximum extent permitted by law, the Service is provided &ldquo;as is&rdquo; and
        &ldquo;as available&rdquo; without warranties of any kind, whether express, implied, or
        statutory, including any implied warranties of merchantability, fitness for a particular
        purpose, title, and non-infringement. We do not warrant that the Service will be
        uninterrupted, secure, or error-free, or that it will meet your requirements.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Ants and its affiliates will not be liable for any
        indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss
        of profits, revenue, data, or goodwill, arising out of or related to the Service. To the
        fullest extent permitted by law, Ants&rsquo; total aggregate liability for all claims arising
        out of or related to the Service is limited to the greater of (a) the amounts you paid to us
        for the Service in the twelve (12) months preceding the event giving rise to the claim, or (b)
        USD&nbsp;100. Some jurisdictions do not allow certain limitations, so some of the above may not
        apply to you.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Ants and its affiliates from and against any
        claims, damages, liabilities, and expenses (including reasonable legal fees) arising out of or
        related to your applications, your Customer Data, or your violation of these Terms or
        applicable law.
      </p>

      <h2>14. Governing law and dispute resolution</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which Ants is established, without
        regard to its conflict-of-laws rules, and excluding the United Nations Convention on Contracts
        for the International Sale of Goods. The courts of that jurisdiction will have exclusive
        jurisdiction over any dispute, except that either party may seek injunctive relief in any
        court of competent jurisdiction. Nothing in these Terms affects mandatory consumer-protection
        rights you may have under your local law.
      </p>

      <h2>15. General</h2>
      <p>
        These Terms, together with the Privacy Policy and Cookie Policy, constitute the entire
        agreement between you and Ants regarding the Service. If any provision is held unenforceable,
        the remaining provisions remain in effect. Our failure to enforce a provision is not a waiver.
        You may not assign these Terms without our consent; we may assign them in connection with a
        merger, acquisition, or sale of assets. There are no third-party beneficiaries.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href="mailto:adventnurutech@gmail.com">adventnurutech@gmail.com</a>.
      </p>

      
    </>
  );
}
