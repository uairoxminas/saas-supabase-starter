import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Profile } from "@/lib/types";
import { UserIcon, SettingsIcon } from "lucide-react";

async function AppHomepage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const typedProfile = profile as Profile | null;
  const displayName =
    typedProfile?.full_name || typedProfile?.email || user?.email || "there";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {displayName} 👋
        </h1>
        <p className="text-muted-foreground">
          This is your dashboard. Build whatever you want here.
        </p>
      </div>

      {/* Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Your account
          </CardTitle>
          <CardDescription>Profile details from Supabase</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="font-medium">Name</span>
            <span className="text-muted-foreground">
              {typedProfile?.full_name || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Email</span>
            <span className="text-muted-foreground">
              {typedProfile?.email || user?.email || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Plan</span>
            <span className="text-muted-foreground">
              {typedProfile?.plan || "Free"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Subscription</span>
            <span className="text-muted-foreground">
              {typedProfile?.subscription_status || "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Navigate around the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/app/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AppHomepage;
