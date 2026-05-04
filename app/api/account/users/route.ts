import { NextResponse } from "next/server";
import { listAccountDirectoryUsers } from "@/lib/auth-session";
import { isUserDirectoryEnabled } from "@/lib/auth-server";

export async function GET() {
  if (!isUserDirectoryEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const users = await listAccountDirectoryUsers();

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
