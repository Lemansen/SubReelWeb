import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { type BugStatus, updateBugModeration } from "@/lib/feedback";

const allowedStatuses = new Set<BugStatus>(["pending", "accepted", "in_progress", "fixed", "rejected"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bugId: string }> },
) {
  const user = await getCurrentAccountUser();
  const { bugId } = await params;

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const status = normalizeText(payload?.status) as BugStatus;
  const moderatorNote = normalizeText(payload?.moderatorNote);

  if (!bugId || !allowedStatuses.has(status)) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  try {
    const bug = await updateBugModeration(user, bugId, { status, moderatorNote });
    return NextResponse.json({ ok: true, bug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "bug_update_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "forbidden" ? 403 : 500 },
    );
  }
}
