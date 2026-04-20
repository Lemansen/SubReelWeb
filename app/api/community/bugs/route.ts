import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { createBugForUser, getFeedbackDashboardData } from "@/lib/feedback";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSeverity(value: unknown): "low" | "normal" | "high" | "critical" {
  return value === "low" || value === "high" || value === "critical" ? value : "normal";
}

export async function GET() {
  const user = await getCurrentAccountUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const data = await getFeedbackDashboardData(user);
  return NextResponse.json({ ok: true, bugs: data.myBugs });
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
  const location = normalizeText(payload?.location);
  const severity = normalizeSeverity(payload?.severity);

  if (!title || !summary || !details) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  try {
    const bug = await createBugForUser(user, { title, summary, details, location, severity });
    return NextResponse.json({ ok: true, bug });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "bug_create_failed" },
      { status: 500 },
    );
  }
}
