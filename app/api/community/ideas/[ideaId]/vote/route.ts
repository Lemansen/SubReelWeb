import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { voteIdeaForUser } from "@/lib/feedback";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> },
) {
  const user = await getCurrentAccountUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { ideaId } = await params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const value = payload?.value === -1 ? -1 : payload?.value === 1 ? 1 : 0;

  if (!ideaId || value === 0) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  try {
    const result = await voteIdeaForUser(user, ideaId, value);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "vote_failed" },
      { status: 500 },
    );
  }
}
