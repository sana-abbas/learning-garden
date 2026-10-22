import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resolveMyRole } from "@/lib/role";
import type { DailyUpdateRow, InviteRow, ParticipantRow } from "./types";
import { todayISO } from "./format";

export type StaffRole = "mentor" | "founder";

export interface StaffDashboard {
  user: User | null;
  loading: boolean;
  /** Both roles, so a route can offer a link to the other dashboard. */
  isMentor: boolean;
  isFounder: boolean;

  /** Participants with a cohort. Removed participants are not in here. */
  participants: ParticipantRow[];
  /**
   * Signed in at some point, but no longer in a cohort: removed by a mentor.
   * Kept apart so no view counts them, or shows them under a default cohort.
   */
  removedParticipants: ParticipantRow[];
  /**
   * Participants Notion's Status marks as "Graduated". Still in `participants`
   * (their updates and reflections stay visible); views that list people to
   * work with — the cards, attendance — leave them out.
   */
  graduatedIds: Set<string>;
  /** user_id → cohort slug. Absent means no cohort_members row at all. */
  cohortMemberMap: Record<string, string>;
  /** Who posted a daily update today, for the "posted today" count. */
  todayUpdateUserIds: Set<string>;
  /** The garden's access list. An email here can get in, to that cohort. */
  invites: InviteRow[];
  /** Re-reads memberships and invites after a participant is added or removed. */
  refreshAccess: () => Promise<void>;

  dailyUpdates: DailyUpdateRow[];
  loadingUpdates: boolean;
  fetchDailyUpdates: () => Promise<void>;

  signOut: () => Promise<void>;
}

/**
 * Auth guard and shared data load for /mentor and /founder.
 *
 * Both dashboards read the same tables — the difference is the role required
 * and what each does with the rows. Having one loader means the two cannot
 * drift into disagreeing about, say, whether staff count as participants.
 *
 * A user who holds the wrong role is sent to the dashboard they do have rather
 * than bounced to the garden, so a founder who follows a /mentor link lands
 * somewhere useful.
 */
export function useStaffDashboard(require: StaffRole): StaffDashboard {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMentor, setIsMentor] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [allParticipants, setAllParticipants] = useState<ParticipantRow[]>([]);
  const [cohortMemberMap, setCohortMemberMap] = useState<Record<string, string>>({});
  const [todayUpdateUserIds, setTodayUpdateUserIds] = useState<Set<string>>(new Set());
  const [rawInvites, setInvites] = useState<InviteRow[]>([]);
  const [graduatedIds, setGraduatedIds] = useState<Set<string>>(new Set());
  const [staffEmails, setStaffEmails] = useState<Set<string>>(new Set());
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdateRow[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setUser(session.user);

      // Via resolveMyRole rather than reading founders directly: an invited
      // founder has no founders row until their first sign-in, and this is
      // what creates it. Without it, a first-time founder following a /founder
      // link would be bounced to the garden.
      const { isFounder: founder, isMentor: mentor } = await resolveMyRole(session.user.id);
      if (cancelled) return;

      setIsMentor(mentor);
      setIsFounder(founder);

      const permitted = require === "founder" ? founder : mentor;
      if (!permitted) {
        if (require === "founder" && mentor) navigate({ to: "/mentor" });
        else if (require === "mentor" && founder) navigate({ to: "/founder" });
        else navigate({ to: "/" });
        return;
      }

      const today = todayISO();
      const [
        { data: progress },
        access,
        { data: postedToday },
        { data: allMentors },
        { data: allFounders },
        { data: statuses },
      ] = await Promise.all([
        supabase
          .from("user_progress")
          .select(
            "user_id, display_name, email, avatar_url, checked, notes, submissions, streak_count, streak_date, created_at, updated_at",
          )
          .order("updated_at", { ascending: false }),
        loadAccess(),
        supabase.from("daily_updates").select("user_id").eq("date", today),
        supabase.from("mentors").select("user_id"),
        supabase.from("founders").select("user_id"),
        // Fails harmlessly (no graduates hidden) until 2026-10-15-graduates.sql runs.
        supabase.rpc("participant_statuses"),
      ]);
      if (cancelled) return;

      // Staff previewing a garden have a user_progress row of their own. Left
      // in, they inflate every count and show up as idle participants.
      const staffIds = new Set<string>([
        ...(allMentors ?? []).map((m) => m.user_id),
        ...(allFounders ?? []).map((f) => f.user_id),
      ]);

      // Emails we can tie to staff: their own preview rows, plus whoever is
      // signed in. Old invites for staff predate the access rules and would
      // otherwise show up as participants who have not signed in yet.
      const progressRows = (progress as ParticipantRow[] | null) ?? [];
      setStaffEmails(
        new Set(
          [
            session.user.email,
            ...progressRows.filter((p) => staffIds.has(p.user_id)).map((p) => p.email),
          ]
            .filter((e): e is string => !!e)
            .map((e) => e.toLowerCase()),
        ),
      );

      setGraduatedIds(
        new Set((statuses ?? []).filter((r) => r.status === "Graduated").map((r) => r.user_id)),
      );
      setTodayUpdateUserIds(new Set((postedToday ?? []).map((r) => r.user_id)));
      setCohortMemberMap(access.memberMap);
      setInvites(access.invites);
      setAllParticipants(progressRows.filter((p) => !staffIds.has(p.user_id)));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, require]);

  const [participants, removedParticipants] = useMemo(() => {
    const active: ParticipantRow[] = [];
    const removed: ParticipantRow[] = [];
    for (const p of allParticipants) (cohortMemberMap[p.user_id] ? active : removed).push(p);
    return [active, removed];
  }, [allParticipants, cohortMemberMap]);

  const invites = useMemo(
    () => rawInvites.filter((i) => !staffEmails.has(i.email)),
    [rawInvites, staffEmails],
  );

  const refreshAccess = useCallback(async () => {
    const access = await loadAccess();
    setCohortMemberMap(access.memberMap);
    setInvites(access.invites);
  }, []);

  const fetchDailyUpdates = async () => {
    if (loadingUpdates || dailyUpdates.length > 0) return;
    setLoadingUpdates(true);
    const { data } = await supabase
      .from("daily_updates")
      .select("id, user_id, date, today, tomorrow, blockers, created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setDailyUpdates((data as DailyUpdateRow[] | null) ?? []);
    setLoadingUpdates(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return {
    user,
    loading,
    isMentor,
    isFounder,
    participants,
    removedParticipants,
    graduatedIds,
    cohortMemberMap,
    todayUpdateUserIds,
    invites,
    refreshAccess,
    dailyUpdates,
    loadingUpdates,
    fetchDailyUpdates,
    signOut,
  };
}

/** Who is in which cohort, and who is on the access list. */
async function loadAccess(): Promise<{
  memberMap: Record<string, string>;
  invites: InviteRow[];
}> {
  const [{ data: members }, { data: inviteRows }] = await Promise.all([
    supabase.from("cohort_members").select("user_id, cohorts(slug)"),
    supabase.from("cohort_invites").select("email, created_at, cohorts(slug)"),
  ]);

  const memberMap: Record<string, string> = {};
  (members ?? []).forEach((m) => {
    const slug = (m.cohorts as { slug: string } | null)?.slug;
    memberMap[m.user_id] = slug ?? "full-stack";
  });

  const invites: InviteRow[] = (inviteRows ?? []).map((r) => ({
    email: r.email.toLowerCase(),
    cohort: (r.cohorts as { slug: string } | null)?.slug ?? "full-stack",
    created_at: r.created_at,
  }));

  return { memberMap, invites };
}
