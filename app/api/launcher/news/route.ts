import { NextResponse } from "next/server";
import { getPublishedLauncherAnnouncements, toLauncherNewsPayload } from "@/lib/launcher-news";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcements = await getPublishedLauncherAnnouncements();
    return NextResponse.json(toLauncherNewsPayload(announcements));
  } catch (error) {
    return NextResponse.json(
      {
        news: [],
        error: error instanceof Error ? error.message : "news_fetch_failed",
      },
      { status: 500 },
    );
  }
}
