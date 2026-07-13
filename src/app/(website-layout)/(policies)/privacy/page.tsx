import { appConfig } from "@/lib/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Privacy Policy | ${appConfig.projectName}`,
  description: `Privacy Policy for ${appConfig.projectName}.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <header className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-5xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      </header>

      <main>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create an account,
          including your name, email address, and any other information you choose to provide.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our services, to
          process transactions, send you technical notices, and respond to your comments and
          questions.
        </p>

        <h2>3. Information Sharing</h2>
        <p>
          We do not share your personal information with third parties except as described in this
          policy. This includes service providers who assist us in operating the platform.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We take reasonable measures to help protect your personal information from loss, theft,
          misuse, unauthorized access, disclosure, alteration, and destruction.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our service. You
          can instruct your browser to refuse all cookies or indicate when a cookie is being sent.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You may access, update, or delete your personal information at any time through your
          account settings or by contacting us directly.
        </p>

        <h2>7. Contact</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href={`mailto:${appConfig.legal.email}`}>{appConfig.legal.email}</a>.
        </p>
      </main>
    </>
  );
}
