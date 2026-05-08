import type { AccountUser } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type LauncherAnnouncementKind = "info" | "update" | "warning" | "event";
export type LauncherAnnouncementScope = "launcher" | "server" | "site" | "global";

export type LauncherAnnouncementRecord = {
  id: string;
  scope: LauncherAnnouncementScope;
  kind: LauncherAnnouncementKind;
  title: string;
  summary: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
};

type LauncherAnnouncementRow = {
  id: string;
  scope: LauncherAnnouncementScope;
  kind: LauncherAnnouncementKind;
  title: string;
  summary: string;
  body: string;
  cta_label: string;
  cta_url: string;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
};

function assertStaff(user: AccountUser | null): asserts user is AccountUser {
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    throw new Error("forbidden");
  }
}

function mapAnnouncement(row: LauncherAnnouncementRow): LauncherAnnouncementRecord {
  return {
    id: row.id,
    scope: row.scope,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    body: row.body,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    isPinned: row.is_pinned,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

export async function getPublishedLauncherAnnouncements() {
  const admin = getSupabaseAdminClient() as any;
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("launcher_announcements")
    .select("id, scope, kind, title, summary, body, cta_label, cta_url, is_pinned, published_at, expires_at")
    .lte("published_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(error.message);
  }

  return ((data as LauncherAnnouncementRow[] | null) ?? []).map(mapAnnouncement);
}

export async function getModerationLauncherAnnouncements(viewer: AccountUser | null) {
  assertStaff(viewer);
  const admin = getSupabaseAdminClient() as any;

  const { data, error } = await admin
    .from("launcher_announcements")
    .select("id, scope, kind, title, summary, body, cta_label, cta_url, is_pinned, published_at, expires_at")
    .order("published_at", { ascending: false })
    .limit(32);

  if (error) {
    throw new Error(error.message);
  }

  return ((data as LauncherAnnouncementRow[] | null) ?? []).map(mapAnnouncement);
}

export async function createLauncherAnnouncement(
  viewer: AccountUser | null,
  payload: {
    scope: LauncherAnnouncementScope;
    kind: LauncherAnnouncementKind;
    title: string;
    summary: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
    isPinned: boolean;
  },
) {
  assertStaff(viewer);
  const admin = getSupabaseAdminClient() as any;

  const { data, error } = await admin
    .from("launcher_announcements")
    .insert({
      scope: payload.scope,
      kind: payload.kind,
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      body: payload.body.trim(),
      cta_label: payload.ctaLabel.trim(),
      cta_url: payload.ctaUrl.trim(),
      is_pinned: payload.isPinned,
      published_at: new Date().toISOString(),
    })
    .select("id, scope, kind, title, summary, body, cta_label, cta_url, is_pinned, published_at, expires_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "announcement_create_failed");
  }

  return mapAnnouncement(data as LauncherAnnouncementRow);
}

export function toLauncherNewsPayload(items: LauncherAnnouncementRecord[]) {
  return {
    news: items.map((item, index) => ({
      id: index + 1,
      type: item.scope === "global" || item.scope === "site" ? "launcher" : item.scope,
      category: item.kind.toUpperCase(),
      title: item.title,
      date: item.publishedAt,
      summary: item.summary || item.body,
      description: item.body || item.summary,
      accent: item.kind,
      accent_color:
        item.kind === "warning"
          ? "#F59E0B"
          : item.kind === "event"
            ? "#22C55E"
            : item.kind === "update"
              ? "#5A7CFF"
              : "#7FB8FF",
      sections: item.body
        ? [
            {
              icon: "news",
              emoji: item.kind === "event" ? "★" : "i",
              tone: item.kind,
              title: "Подробности",
              items: item.body
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean),
            },
          ]
        : [],
      changes: [],
      button_text: item.ctaLabel,
      button_url: item.ctaUrl,
    })),
  };
}
