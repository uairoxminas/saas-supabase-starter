import { appConfig } from "@/lib/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Cookie Policy | ${appConfig.projectName}`,
  description: `Cookie Policy for ${appConfig.projectName}.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/cookie`,
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      <header className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-5xl">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      </header>

      <main>
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files placed on your device when you visit a website. They help
          the site remember your preferences and improve your experience.
        </p>

        <h2>2. How We Use Cookies</h2>
        <p>
          {appConfig.projectName} uses cookies to keep you signed in, remember your preferences,
          understand how you use our service, and improve performance.
        </p>

        <h2>3. Types of Cookies We Use</h2>
        <p>
          <strong>Essential cookies:</strong> Required for the service to function, such as
          authentication and session management.
        </p>
        <p>
          <strong>Analytics cookies:</strong> Help us understand how visitors interact with our
          platform so we can improve it.
        </p>

        <h2>4. Managing Cookies</h2>
        <p>
          You can control and manage cookies through your browser settings. Note that disabling
          essential cookies may affect the functionality of the service.
        </p>

        <h2>5. Third-Party Cookies</h2>
        <p>
          Some features of our service may use third-party cookies (for example, analytics
          providers). These are governed by the respective third-party privacy policies.
        </p>

        <h2>6. Contact</h2>
        <p>
          If you have questions about our use of cookies, please contact us at{" "}
          <a href={`mailto:${appConfig.legal.email}`}>{appConfig.legal.email}</a>.
        </p>
      </main>
    </>
  );
}
