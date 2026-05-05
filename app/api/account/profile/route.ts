import { NextResponse } from "next/server";
import { updateCurrentAccountPassword, updateCurrentAccountProfile } from "@/lib/auth-session";

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    login?: string;
    nickname?: string;
  };

  const result = await updateCurrentAccountProfile({
    login: body.login ?? "",
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
  const body = (await request.json()) as {
    currentPassword?: string;
    nextPassword?: string;
  };

  const result = await updateCurrentAccountPassword({
    currentPassword: body.currentPassword ?? "",
    nextPassword: body.nextPassword ?? "",
  });

  if (!result.ok) {
    const status = result.error === "unauthorized" ? 401 : result.error === "invalid" ? 403 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
