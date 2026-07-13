import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface AuthedHandler {
  (
    req: NextRequest,
    context: {
      user: User;
      supabase: SupabaseClient;
      params: Promise<Record<string, unknown>>;
    },
  ): Promise<NextResponse | Response>;
}

const withAuthRequired = (handler: AuthedHandler) => {
  return async (
    req: NextRequest,
    context: {
      params: Promise<Record<string, unknown>>;
    },
  ) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, {
      user,
      supabase,
      params: context.params,
    });
  };
};

export default withAuthRequired;
