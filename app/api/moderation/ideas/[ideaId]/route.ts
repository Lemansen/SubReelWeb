import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { deleteIdeaModeration, type IdeaStatus, updateIdeaModeration } from "@/lib/feedback";

const allowedStatuses = new Set<IdeaStatus>(["pending", "approved", "rejected", "in_progress", "done"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> },
) {
  const user = await getCurrentAccountUser();
  const { ideaId } = await params;

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const status = normalizeText(payload?.status) as IdeaStatus;
  const moderatorNote = normalizeText(payload?.moderatorNote);

  if (!ideaId || !allowedStatuses.has(status)) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  try {
    const idea = await updateIdeaModeration(user, ideaId, { status, moderatorNote });
    return NextResponse.json({ ok: true, idea });
  } catch (error) {
    const message = error instanceof Error ? error.message : "idea_update_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "forbidden" ? 403 : 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ideaId: string }> },
) {
  const user = await getCurrentAccountUser();
  const { ideaId } = await params;

  if (!ideaId) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  try {
    const deleted = await deleteIdeaModeration(user, ideaId);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "idea_delete_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "forbidden" ? 403 : 500 },
    );
  }
}
