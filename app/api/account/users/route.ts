import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isUserDirectoryEnabled, listUsersForDirectory } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function GET() {
  if (!isUserDirectoryEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const users = await listUsersForDirectory(sessionToken);

  if (!users) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: true,
      total: users.length,
      users,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
