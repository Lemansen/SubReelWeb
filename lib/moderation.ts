import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ModerationSnapshot = {
  pendingIdeas: number;
  pendingBugs: number;
  newestIdeas: Array<{ id: string; title: string; status: string; createdAt: string }>;
  newestBugs: Array<{ id: string; title: string; status: string; createdAt: string }>;
};

const emptySnapshot: ModerationSnapshot = {
  pendingIdeas: 0,
  pendingBugs: 0,
  newestIdeas: [],
  newestBugs: [],
};

export async function getModerationSnapshot(): Promise<ModerationSnapshot> {
  try {
    const admin = getSupabaseAdminClient() as any;

    const [ideasResult, bugsResult] = await Promise.all([
      admin
        .from("feature_ideas")
        .select("id, title, status, created_at", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("bug_reports")
        .select("id, title, status, created_at", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      pendingIdeas: ideasResult.count ?? 0,
      pendingBugs: bugsResult.count ?? 0,
      newestIdeas:
        ideasResult.data?.map((item: any) => ({
          id: item.id as string,
          title: item.title as string,
          status: item.status as string,
          createdAt: item.created_at as string,
        })) ?? [],
      newestBugs:
        bugsResult.data?.map((item: any) => ({
          id: item.id as string,
          title: item.title as string,
          status: item.status as string,
          createdAt: item.created_at as string,
        })) ?? [],
    };
  } catch {
    return emptySnapshot;
  }
}
