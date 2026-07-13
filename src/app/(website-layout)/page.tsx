import { appConfig } from "@/lib/config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function WebsiteHomepage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-40 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <Badge variant="secondary" className="mb-6">
            Now in beta
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            {appConfig.projectName}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-xl mx-auto">
            {appConfig.description}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-semibold text-center mb-4">
            Everything you need to ship
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            A solid foundation so you can focus on building features, not
            boilerplate.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Authentication",
                description:
                  "Email/password and Google OAuth out of the box, powered by Supabase.",
              },
              {
                title: "Payments",
                description:
                  "Stripe and Digital Manager Guru integrated, ready for subscriptions.",
              },
              {
                title: "Database",
                description:
                  "Supabase Postgres with row-level security, migrations, and type-safe queries.",
              },
              {
                title: "UI Components",
                description:
                  "shadcn/ui + Tailwind 4. Beautiful, accessible, fully customizable.",
              },
              {
                title: "Type-safe",
                description:
                  "TypeScript throughout the stack. Catch bugs at compile time.",
              },
              {
                title: "App Router",
                description:
                  "Next.js App Router with server components, layouts, and streaming.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-semibold text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Start free, upgrade when you need more.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-3xl border bg-card flex flex-col p-8">
              <div className="mb-8">
                <h3 className="text-xl font-semibold">Free</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  For individuals getting started
                </p>
                <p className="mt-6 text-5xl font-bold">
                  $0
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    / mo
                  </span>
                </p>
              </div>
              <ul className="flex-1 space-y-3 text-sm">
                {[
                  "Up to 3 projects",
                  "Core features",
                  "Community support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </div>
            </div>

            {/* Pro */}
            <div className="rounded-3xl border bg-card flex flex-col p-8 ring-1 ring-primary/20 relative">
              <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold">Pro</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  For teams and growing products
                </p>
                <p className="mt-6 text-5xl font-bold">
                  $29
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    / mo
                  </span>
                </p>
              </div>
              <ul className="flex-1 space-y-3 text-sm">
                {[
                  "Unlimited projects",
                  "All features",
                  "Priority support",
                  "Advanced analytics",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild className="w-full">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Ready to build?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of developers shipping faster with{" "}
            {appConfig.projectName}.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/sign-up">Start for free</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
