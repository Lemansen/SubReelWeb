import { NextResponse } from "next/server";
import { authenticateLauncher } from "@/lib/auth-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    identifier?: string;
    password?: string;
  };

  const user = await authenticateLauncher({
    identifier: body.identifier ?? "",
    password: body.password ?? "",
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    launcher: {
      token: user.launcherToken,
      user,
    },
  });
}
