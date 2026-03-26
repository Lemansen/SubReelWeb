import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { updatePasswordBySession, updateProfileBySession } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const body = (await request.json()) as {
    login?: string;
    email?: string;
    nickname?: string;
  };

  const result = await updateProfileBySession(sessionToken, {
    login: body.login ?? "",
    email: body.email ?? "",
    nickname: body.nickname ?? "",
  });

  if (!result.ok) {
    const status =
      result.error === "unauthorized" ? 401 : result.error === "exists" ? 409 : 400;

    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const body = (await request.json()) as {
    currentPassword?: string;
    nextPassword?: string;
  };

  const result = await updatePasswordBySession(sessionToken, {
    currentPassword: body.currentPassword ?? "",
    nextPassword: body.nextPassword ?? "",
  });

  if (!result.ok) {
    const status = result.error === "unauthorized" ? 401 : result.error === "invalid" ? 403 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
