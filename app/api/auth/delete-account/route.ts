import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient, serviceRoleConfigDebug } from "@/lib/supabase/service";
import { requireSupabaseConfigured } from "@/lib/supabase/guard";

export const dynamic = "force-dynamic";

export async function POST() {
  const missing = requireSupabaseConfigured();
  if (missing) return missing;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseServiceClient();
  if (!admin) {
    return NextResponse.json(
      {
        code: "MISSING_SERVICE_ROLE",
        error:
          "Account deletion needs SUPABASE_SERVICE_ROLE_KEY in the saved `.env.local` on disk (same folder as `package.json`). If you see the key in the editor but `serviceRoleLineOnDisk` is false in the debug block below, save the file (Cmd/Ctrl+S) and restart `npm run dev`. Otherwise paste the legacy **service_role** JWT or the new **Secret** key from Supabase → Settings → API. Never commit this key.",
        ...(process.env.NODE_ENV === "development"
          ? { debug: serviceRoleConfigDebug() }
          : {})
      },
      { status: 503 }
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ message: "Account deleted" });
}
