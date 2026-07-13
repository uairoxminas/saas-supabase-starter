import { appConfig } from "@/lib/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Terms of Service | ${appConfig.projectName}`,
  description: `Terms of Service for ${appConfig.projectName}.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
  },
};

export default function TermsPage() {
  return (
    <>
      <header className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-5xl">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      </header>

      <main>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {appConfig.projectName}, you agree to be bound by these Terms of
          Service and all applicable laws and regulations. If you do not agree with any of these
          terms, you are prohibited from using this service.
        </p>

        <h2>2. Use of Service</h2>
        <p>
          You may use {appConfig.projectName} only for lawful purposes and in accordance with these
          Terms. You agree not to use the service in any way that violates applicable local,
          national, or international law or regulation.
        </p>

        <h2>3. Accounts</h2>
        <p>
          When you create an account, you must provide accurate and complete information. You are
          responsible for maintaining the security of your account and for all activities that occur
          under your account.
        </p>

        <h2>4. Intellectual Property</h2>
        <p>
          The service and its original content, features, and functionality are owned by{" "}
          {appConfig.legal.companyName} and are protected by applicable intellectual property laws.
        </p>

        <h2>5. Termination</h2>
        <p>
          We may terminate or suspend your access to the service immediately, without prior notice
          or liability, for any reason, including if you breach these Terms.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          In no event shall {appConfig.legal.companyName} be liable for any indirect, incidental,
          special, consequential, or punitive damages arising out of your use of the service.
        </p>

        <h2>7. Contact</h2>
        <p>
          If you have questions about these Terms, please contact us at{" "}
          <a href={`mailto:${appConfig.legal.email}`}>{appConfig.legal.email}</a>.
        </p>
      </main>
    </>
  );
}
