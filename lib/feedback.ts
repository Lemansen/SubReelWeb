import type { AccountUser } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type IdeaStatus = "pending" | "approved" | "rejected" | "in_progress" | "done";
export type BugStatus = "pending" | "accepted" | "in_progress" | "fixed" | "rejected";
export type IdeaVoteValue = -1 | 0 | 1;

export type PublicIdea = {
  id: string;
  title: string;
  summary: string;
  details: string;
  status: IdeaStatus;
  moderatorNote: string;
  votesUp: number;
  votesDown: number;
  createdAt: string;
  author: {
    login: string;
    nickname: string;
  } | null;
  currentVote: IdeaVoteValue;
};

export type UserIdea = {
  id: string;
  title: string;
  summary: string;
  status: IdeaStatus;
  moderatorNote: string;
  createdAt: string;
};

export type UserBug = {
  id: string;
  title: string;
  summary: string;
  status: BugStatus;
  severity: "low" | "normal" | "high" | "critical";
  createdAt: string;
};

export type FeedbackDashboardData = {
  publishedIdeas: PublicIdea[];
  myIdeas: UserIdea[];
  myBugs: UserBug[];
};

export type ModerationIdeaRecord = {
  id: string;
  title: string;
  summary: string;
  status: IdeaStatus;
  moderatorNote: string;
  votesUp: number;
  votesDown: number;
  createdAt: string;
  author: {
    login: string;
    nickname: string;
    email: string;
  } | null;
};

export type ModerationBugRecord = {
  id: string;
  title: string;
  summary: string;
  details: string;
  location: string;
  severity: "low" | "normal" | "high" | "critical";
  status: BugStatus;
  moderatorNote: string;
  createdAt: string;
  author: {
    login: string;
    nickname: string;
    email: string;
  } | null;
};

export type ModerationDashboardData = {
  pendingIdeas: number;
  pendingBugs: number;
  ideasQueue: ModerationIdeaRecord[];
  bugsQueue: ModerationBugRecord[];
};

type IdeaRow = {
  id: string;
  author_id?: string;
  title: string;
  summary: string;
  details: string;
  status: IdeaStatus;
  moderator_note: string;
  votes_up: number;
  votes_down: number;
  created_at: string;
};

type BugRow = {
  id: string;
  author_id?: string;
  title: string;
  summary: string;
  details: string;
  location: string;
  severity: "low" | "normal" | "high" | "critical";
  status: BugStatus;
  moderator_note: string;
  created_at: string;
};

type VoteRow = {
  idea_id: string;
  value: number;
};

type AuthorProfile = {
  id: string;
  login: string;
  nickname: string;
  email: string;
};

const publishedIdeaStatuses: IdeaStatus[] = ["approved", "in_progress", "done"];

async function loadAuthorProfiles(authorIds: Array<string | undefined>) {
  const ids = Array.from(new Set(authorIds.filter((item): item is string => Boolean(item))));
  if (ids.length === 0) {
    return new Map<string, AuthorProfile>();
  }

  const admin = getSupabaseAdminClient() as any;
  const result = await admin
    .from("user_profiles")
    .select("id, login, nickname, email")
    .in("id", ids);

  return new Map(
    (((result.data as AuthorProfile[] | null) ?? []).map((item) => [item.id, item])) as Array<[string, AuthorProfile]>,
  );
}

function mapPublicIdea(row: IdeaRow, currentVote: IdeaVoteValue, authors: Map<string, AuthorProfile>): PublicIdea {
  const author = row.author_id ? authors.get(row.author_id) ?? null : null;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    details: row.details,
    status: row.status,
    moderatorNote: row.moderator_note,
    votesUp: row.votes_up,
    votesDown: row.votes_down,
    createdAt: row.created_at,
    author: author
      ? {
          login: author.login,
          nickname: author.nickname || author.login,
        }
      : null,
    currentVote,
  };
}

function mapUserIdea(row: IdeaRow): UserIdea {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    moderatorNote: row.moderator_note,
    createdAt: row.created_at,
  };
}

function mapUserBug(row: BugRow): UserBug {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    severity: row.severity,
    createdAt: row.created_at,
  };
}

function mapModerationIdea(row: IdeaRow, authors: Map<string, AuthorProfile>): ModerationIdeaRecord {
  const author = row.author_id ? authors.get(row.author_id) ?? null : null;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    moderatorNote: row.moderator_note,
    votesUp: row.votes_up,
    votesDown: row.votes_down,
    createdAt: row.created_at,
    author: author
      ? {
          login: author.login,
          nickname: author.nickname || author.login,
          email: author.email,
        }
      : null,
  };
}

function mapModerationBug(row: BugRow, authors: Map<string, AuthorProfile>): ModerationBugRecord {
  const author = row.author_id ? authors.get(row.author_id) ?? null : null;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    details: row.details,
    location: row.location,
    severity: row.severity,
    status: row.status,
    moderatorNote: row.moderator_note,
    createdAt: row.created_at,
    author: author
      ? {
          login: author.login,
          nickname: author.nickname || author.login,
          email: author.email,
        }
      : null,
  };
}

function assertStaff(user: AccountUser | null): asserts user is AccountUser {
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    throw new Error("forbidden");
  }
}

export async function getFeedbackDashboardData(viewer: AccountUser) {
  const admin = getSupabaseAdminClient() as any;

  const [publishedIdeasResult, myIdeasResult, myBugsResult] = await Promise.all([
    admin
      .from("feature_ideas")
      .select("id, author_id, title, summary, details, status, moderator_note, votes_up, votes_down, created_at")
      .in("status", publishedIdeaStatuses)
      .order("votes_up", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24),
    admin
      .from("feature_ideas")
      .select("id, title, summary, status, moderator_note, created_at")
      .eq("author_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("bug_reports")
      .select("id, title, summary, status, severity, created_at")
      .eq("author_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const publishedIdeaRows = (publishedIdeasResult.data as IdeaRow[] | null) ?? [];
  const authors = await loadAuthorProfiles(publishedIdeaRows.map((item) => item.author_id));
  const publishedIdeaIds = publishedIdeaRows.map((item) => item.id);

  let currentVotesByIdea = new Map<string, IdeaVoteValue>();

  if (publishedIdeaIds.length > 0) {
    const votesResult = await admin
      .from("idea_votes")
      .select("idea_id, value")
      .eq("voter_id", viewer.id)
      .in("idea_id", publishedIdeaIds);

    currentVotesByIdea = new Map(
      (((votesResult.data as VoteRow[] | null) ?? []).map((item) => [
        item.idea_id,
        (item.value === 1 ? 1 : item.value === -1 ? -1 : 0) as IdeaVoteValue,
      ])) as Array<[string, IdeaVoteValue]>,
    );
  }

  return {
    publishedIdeas: publishedIdeaRows.map((row) => mapPublicIdea(row, currentVotesByIdea.get(row.id) ?? 0, authors)),
    myIdeas: (((myIdeasResult.data as IdeaRow[] | null) ?? []).map(mapUserIdea)),
    myBugs: (((myBugsResult.data as BugRow[] | null) ?? []).map(mapUserBug)),
  } satisfies FeedbackDashboardData;
}

export async function createIdeaForUser(user: AccountUser, payload: { title: string; summary: string; details: string }) {
  const admin = getSupabaseAdminClient() as any;

  const { data, error } = await admin
    .from("feature_ideas")
    .insert({
      author_id: user.id,
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      details: payload.details.trim(),
      status: "pending",
    })
    .select("id, title, summary, status, moderator_note, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "idea_create_failed");
  }

  return mapUserIdea(data as IdeaRow);
}

export async function createBugForUser(
  user: AccountUser,
  payload: { title: string; summary: string; details: string; location: string; severity: "low" | "normal" | "high" | "critical" },
) {
  const admin = getSupabaseAdminClient() as any;

  const { data, error } = await admin
    .from("bug_reports")
    .insert({
      author_id: user.id,
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      details: payload.details.trim(),
      location: payload.location.trim(),
      severity: payload.severity,
      status: "pending",
    })
    .select("id, title, summary, status, severity, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "bug_create_failed");
  }

  return mapUserBug(data as BugRow);
}

export async function voteIdeaForUser(user: AccountUser, ideaId: string, value: 1 | -1) {
  const admin = getSupabaseAdminClient() as any;

  const ideaResult = await admin
    .from("feature_ideas")
    .select("id, status")
    .eq("id", ideaId)
    .maybeSingle();

  const idea = ideaResult.data as { id: string; status: IdeaStatus } | null;
  if (!idea || !publishedIdeaStatuses.includes(idea.status)) {
    throw new Error("idea_not_votable");
  }

  const existingVoteResult = await admin
    .from("idea_votes")
    .select("value")
    .eq("idea_id", ideaId)
    .eq("voter_id", user.id)
    .maybeSingle();

  const existingValue = (existingVoteResult.data?.value ?? 0) as number;
  let currentVote: IdeaVoteValue = value;

  if (existingValue === value) {
    await admin.from("idea_votes").delete().eq("idea_id", ideaId).eq("voter_id", user.id);
    currentVote = 0;
  } else {
    await admin.from("idea_votes").upsert(
      {
        idea_id: ideaId,
        voter_id: user.id,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "idea_id,voter_id" },
    );
  }

  const votesResult = await admin.from("idea_votes").select("value").eq("idea_id", ideaId);
  const votes = (votesResult.data as Array<{ value: number }> | null) ?? [];
  const votesUp = votes.filter((item) => item.value === 1).length;
  const votesDown = votes.filter((item) => item.value === -1).length;

  await admin
    .from("feature_ideas")
    .update({
      votes_up: votesUp,
      votes_down: votesDown,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId);

  return {
    ideaId,
    currentVote,
    votesUp,
    votesDown,
  };
}

export async function getModerationDashboardData(viewer: AccountUser | null) {
  assertStaff(viewer);
  const admin = getSupabaseAdminClient() as any;

  const [ideasResult, bugsResult] = await Promise.all([
    admin
      .from("feature_ideas")
      .select("id, author_id, title, summary, status, moderator_note, votes_up, votes_down, created_at")
      .order("created_at", { ascending: false })
      .limit(32),
    admin
      .from("bug_reports")
      .select("id, author_id, title, summary, details, location, severity, status, moderator_note, created_at")
      .order("created_at", { ascending: false })
      .limit(32),
  ]);

  const ideaRows = (ideasResult.data as IdeaRow[] | null) ?? [];
  const bugRows = (bugsResult.data as BugRow[] | null) ?? [];
  const authors = await loadAuthorProfiles([
    ...ideaRows.map((item) => item.author_id),
    ...bugRows.map((item) => item.author_id),
  ]);

  return {
    pendingIdeas: ideaRows.filter((item) => item.status === "pending").length,
    pendingBugs: bugRows.filter((item) => item.status === "pending").length,
    ideasQueue: ideaRows.map((item) => mapModerationIdea(item, authors)),
    bugsQueue: bugRows.map((item) => mapModerationBug(item, authors)),
  } satisfies ModerationDashboardData;
}

export async function updateIdeaModeration(
  viewer: AccountUser | null,
  ideaId: string,
  payload: { status: IdeaStatus; moderatorNote: string },
) {
  assertStaff(viewer);
  const admin = getSupabaseAdminClient() as any;

  const { data, error } = await admin
    .from("feature_ideas")
    .update({
      status: payload.status,
      moderator_note: payload.moderatorNote.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId)
    .select("id, author_id, title, summary, status, moderator_note, votes_up, votes_down, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "idea_update_failed");
  }

  const authors = await loadAuthorProfiles([(data as IdeaRow).author_id]);
  return mapModerationIdea(data as IdeaRow, authors);
}

export async function updateBugModeration(
  viewer: AccountUser | null,
  bugId: string,
  payload: { status: BugStatus; moderatorNote: string },
) {
  assertStaff(viewer);
  const admin = getSupabaseAdminClient() as any;

  const { data, error } = await admin
    .from("bug_reports")
    .update({
      status: payload.status,
      moderator_note: payload.moderatorNote.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bugId)
    .select("id, author_id, title, summary, details, location, severity, status, moderator_note, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "bug_update_failed");
  }

  const authors = await loadAuthorProfiles([(data as BugRow).author_id]);
  return mapModerationBug(data as BugRow, authors);
}

export async function deleteIdeaModeration(viewer: AccountUser | null, ideaId: string) {
  assertStaff(viewer);

  if (!ideaId) {
    throw new Error("idea_id_required");
  }

  const admin = getSupabaseAdminClient() as any;
  await admin.from("idea_votes").delete().eq("idea_id", ideaId);

  const { error } = await admin.from("feature_ideas").delete().eq("id", ideaId);

  if (error) {
    throw new Error(error.message);
  }

  return { id: ideaId };
}

export async function deleteBugModeration(viewer: AccountUser | null, bugId: string) {
  assertStaff(viewer);

  if (!bugId) {
    throw new Error("bug_id_required");
  }

  const admin = getSupabaseAdminClient() as any;
  const { error } = await admin.from("bug_reports").delete().eq("id", bugId);

  if (error) {
    throw new Error(error.message);
  }

  return { id: bugId };
}
