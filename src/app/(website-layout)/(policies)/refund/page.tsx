import { appConfig } from "@/lib/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Refund Policy | ${appConfig.projectName}`,
  description: `Refund Policy for ${appConfig.projectName}.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/refund`,
  },
};

export default function RefundPolicyPage() {
  return (
    <>
      <header className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-5xl">Refund Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      </header>

      <main>
        <h2>1. Overview</h2>
        <p>
          We want you to be satisfied with your purchase. This Refund Policy explains the
          circumstances under which refunds may be issued for {appConfig.projectName} subscriptions
          and purchases.
        </p>

        <h2>2. Subscription Refunds</h2>
        <p>
          You may request a refund within 7 days of your initial subscription purchase. After this
          period, refunds will be issued at our sole discretion.
        </p>

        <h2>3. How to Request a Refund</h2>
        <p>
          To request a refund, please contact our support team at{" "}
          <a href={`mailto:${appConfig.legal.email}`}>{appConfig.legal.email}</a> with your account
          details and reason for the refund request.
        </p>

        <h2>4. Processing Time</h2>
        <p>
          Approved refunds are typically processed within 5 to 10 business days and will be
          returned to the original payment method.
        </p>

        <h2>5. Non-Refundable Items</h2>
        <p>
          Partial subscription periods and one-time add-ons consumed before the refund request are
          generally non-refundable.
        </p>

        <h2>6. Contact</h2>
        <p>
          If you have questions about this policy, please reach out to{" "}
          <a href={`mailto:${appConfig.legal.email}`}>{appConfig.legal.email}</a>.
        </p>
      </main>
    </>
  );
}
