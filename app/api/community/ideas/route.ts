import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { createIdeaForUser, getFeedbackDashboardData } from "@/lib/feedback";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await getCurrentAccountUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const data = await getFeedbackDashboardData(user);
  return NextResponse.json({ ok: true, ideas: data.publishedIdeas });
}

export async function POST(request: Request) {
  const user = await getCurrentAccountUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = normalizeText(payload?.title);
  const summary = normalizeText(payload?.summary);
  const details = normalizeText(payload?.details);

  if (!title || !summary || !details) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  try {
    const idea = await createIdeaForUser(user, { title, summary, details });
    return NextResponse.json({ ok: true, idea });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "idea_create_failed" },
      { status: 500 },
    );
  }
}
