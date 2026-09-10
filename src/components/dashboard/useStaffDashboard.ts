import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resolveMyRole } from "@/lib/role";
import type { DailyUpdateRow, ParticipantRow } from "./types";
import { todayISO } from "./format";

export type StaffRole = "mentor" | "founder";

export interface StaffDashboard {
  user: User | null;
  loading: boolean;
  /** Both roles, so a route can offer a link to the other dashboard. */
  isMentor: boolean;
  isFounder: boolean;

  participants: ParticipantRow[];
  /** user_id → cohort slug. Absent means no cohort_members row at all. */
  cohortMemberMap: Record<string, string>;
  /** Who posted a daily update today, for the "posted today" count. */
  todayUpdateUserIds: Set<string>;

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
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [cohortMemberMap, setCohortMemberMap] = useState<Record<string, string>>({});
  const [todayUpdateUserIds, setTodayUpdateUserIds] = useState<Set<string>>(new Set());
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
        { data: members },
        { data: postedToday },
        { data: allMentors },
        { data: allFounders },
      ] = await Promise.all([
        supabase
          .from("user_progress")
          .select(
            "user_id, display_name, email, avatar_url, checked, notes, submissions, streak_count, streak_date, created_at, updated_at",
          )
          .order("updated_at", { ascending: false }),
        supabase.from("cohort_members").select("user_id, cohorts(slug)"),
        supabase.from("daily_updates").select("user_id").eq("date", today),
        supabase.from("mentors").select("user_id"),
        supabase.from("founders").select("user_id"),
      ]);
      if (cancelled) return;

      // Staff previewing a garden have a user_progress row of their own. Left
      // in, they inflate every count and show up as idle participants.
      const staffIds = new Set<string>([
        ...(allMentors ?? []).map((m) => m.user_id),
        ...(allFounders ?? []).map((f) => f.user_id),
      ]);

      const map: Record<string, string> = {};
      (members ?? []).forEach((m) => {
        const slug = (m.cohorts as { slug: string } | null)?.slug;
        map[m.user_id] = slug ?? "full-stack";
      });

      setTodayUpdateUserIds(new Set((postedToday ?? []).map((r) => r.user_id)));
      setCohortMemberMap(map);
      setParticipants(
        ((progress as ParticipantRow[] | null) ?? []).filter((p) => !staffIds.has(p.user_id)),
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, require]);

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
    cohortMemberMap,
    todayUpdateUserIds,
    dailyUpdates,
    loadingUpdates,
    fetchDailyUpdates,
    signOut,
  };
}
