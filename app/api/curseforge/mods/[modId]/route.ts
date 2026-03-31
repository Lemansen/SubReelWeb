import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "This endpoint is disabled. The official CurseForge Upload API token from the support article does not provide this public mod details route in the same format.",
    },
    { status: 501 },
  );
}
