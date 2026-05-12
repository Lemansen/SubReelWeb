import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";
import {
  createLauncherAnnouncement,
  deleteLauncherAnnouncement,
  type LauncherAnnouncementKind,
  type LauncherAnnouncementScope,
} from "@/lib/launcher-news";

const allowedScopes = new Set<LauncherAnnouncementScope>(["launcher", "server", "site", "global"]);
const allowedKinds = new Set<LauncherAnnouncementKind>(["info", "update", "warning", "event"]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentAccountUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const scope = typeof body.scope === "string" && allowedScopes.has(body.scope as LauncherAnnouncementScope)
      ? (body.scope as LauncherAnnouncementScope)
      : "launcher";
    const kind = typeof body.kind === "string" && allowedKinds.has(body.kind as LauncherAnnouncementKind)
      ? (body.kind as LauncherAnnouncementKind)
      : "info";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";
    const announcementBody = typeof body.body === "string" ? body.body.trim() : "";
    const ctaLabel = typeof body.ctaLabel === "string" ? body.ctaLabel.trim() : "";
    const ctaUrl = typeof body.ctaUrl === "string" ? body.ctaUrl.trim() : "";
    const isPinned = Boolean(body.isPinned);

    if (!title || (!summary && !announcementBody)) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const announcement = await createLauncherAnnouncement(user, {
      scope,
      kind,
      title,
      summary,
      body: announcementBody,
      ctaLabel,
      ctaUrl,
      isPinned,
    });

    return NextResponse.json({ ok: true, announcement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "news_create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: message === "forbidden" ? 403 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentAccountUser();
    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get("id")?.trim() ?? "";

    if (!announcementId) {
      return NextResponse.json({ ok: false, error: "announcement_id_required" }, { status: 400 });
    }

    const deleted = await deleteLauncherAnnouncement(user, announcementId);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "news_delete_failed";
    return NextResponse.json({ ok: false, error: message }, { status: message === "forbidden" ? 403 : 500 });
  }
}
