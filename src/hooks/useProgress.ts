import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── helpers ──────────────────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function lsKey(kind: string, userId: string) {
  return `cb_${kind}_${userId}`;
}

// ── public types ─────────────────────────────────────────────────────────────

export type Submission = {
  link?: string;
  link2?: string;
  video?: string;
  claimedAt?: string;
  submittedAt?: string;
};
export type Submissions = Record<string, Submission>;

export interface ProgressState {
  checked: Record<string, boolean>;
  setChecked: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submissions: Submissions;
  setSubmission: (id: string, data: Submission) => void;
  streak: number;
  bumpStreak: () => void;
  syncing: boolean;
  saveNow: () => Promise<void>;
  onboarded: boolean;
  progressReady: boolean;
  setOnboarded: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useProgress(userId: string | null): ProgressState {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<Submissions>({});
  const [streak, setStreak] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [progressReady, setProgressReady] = useState(false);

  // Refs that hold current state values for the debounced upsert
  const loaded = useRef(false);
  const streakDateRef = useRef<string | null>(null);
  const streakCountRef = useRef(0);
  const onboardedRef = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live snapshots so the debounce always reads the latest values
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;

  // ── Debounced Supabase upsert ─────────────────────────────────────────────

  const scheduleUpsert = useCallback(
    (
      nextChecked: Record<string, boolean>,
      nextNotes: Record<string, string>,
      nextSubmissions: Submissions,
      nextStreak: number,
      nextStreakDate: string | null,
    ) => {
      if (!userId || !loaded.current) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(async () => {
        setSyncing(true);
        try {
          await supabase.from("user_progress").upsert(
            {
              user_id: userId,
              checked: nextChecked,
              notes: nextNotes,
              submissions: nextSubmissions,
              onboarded: onboardedRef.current,
              streak_count: nextStreak,
              streak_date: nextStreakDate,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        } catch {
          // Fail silently — localStorage is still up to date
        } finally {
          setSyncing(false);
        }
      }, 1000);
    },
    [userId],
  );

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    loaded.current = false;
    setProgressReady(false);

    async function loadProgress() {
      setSyncing(true);
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("checked, notes, submissions, onboarded, streak_count, streak_date")
          .eq("user_id", userId!)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const remoteChecked = (data.checked ?? {}) as Record<string, boolean>;
          const remoteNotes = (data.notes ?? {}) as Record<string, string>;
          const remoteSubmissions = (data.submissions ?? {}) as Submissions;
          const remoteOnboarded = data.onboarded ?? false;
          const remoteStreak = data.streak_count ?? 0;
          const remoteDate = data.streak_date ?? null;

          setChecked(remoteChecked);
          setNotes(remoteNotes);
          setSubmissions(remoteSubmissions);
          setStreak(remoteStreak);
          streakCountRef.current = remoteStreak;
          streakDateRef.current = remoteDate;
          onboardedRef.current = remoteOnboarded;

          // Auto-onboard users who already have progress (retroactive)
          const effectiveOnboarded =
            remoteOnboarded || Object.keys(remoteChecked).length > 0;
          setOnboardedState(effectiveOnboarded);
          if (effectiveOnboarded && !remoteOnboarded) {
            onboardedRef.current = true;
            // Persist the correction silently
            supabase
              .from("user_progress")
              .upsert(
                { user_id: userId!, onboarded: true, updated_at: new Date().toISOString() },
                { onConflict: "user_id" },
              )
              .then(() => {});
          }

          // Cache to localStorage
          localStorage.setItem(lsKey("checked", userId!), JSON.stringify(remoteChecked));
          localStorage.setItem(lsKey("notes", userId!), JSON.stringify(remoteNotes));
          localStorage.setItem(lsKey("submissions", userId!), JSON.stringify(remoteSubmissions));
          localStorage.setItem(lsKey("streak_count", userId!), String(remoteStreak));
          localStorage.setItem(lsKey("onboarded", userId!), String(effectiveOnboarded));
          if (remoteDate) localStorage.setItem(lsKey("streak_date", userId!), remoteDate);
        } else {
          // No DB record — user is genuinely new or was reset. Start fresh.
          // Clear any stale localStorage so it doesn't bleed into the new session.
          localStorage.removeItem(lsKey("checked", userId!));
          localStorage.removeItem(lsKey("notes", userId!));
          localStorage.removeItem(lsKey("submissions", userId!));
          localStorage.removeItem(lsKey("streak_count", userId!));
          localStorage.removeItem(lsKey("streak_date", userId!));
          localStorage.removeItem(lsKey("onboarded", userId!));
        }
      } catch {
        // Supabase unreachable — fall back to localStorage silently
        try {
          const saved = localStorage.getItem(lsKey("checked", userId!));
          if (saved) setChecked(JSON.parse(saved));
          const savedNotes = localStorage.getItem(lsKey("notes", userId!));
          if (savedNotes) setNotes(JSON.parse(savedNotes));
          const savedSubs = localStorage.getItem(lsKey("submissions", userId!));
          if (savedSubs) setSubmissions(JSON.parse(savedSubs));
          const savedStreak = parseInt(localStorage.getItem(lsKey("streak_count", userId!)) ?? "0");
          const savedDate = localStorage.getItem(lsKey("streak_date", userId!)) ?? null;
          const savedOnboarded = localStorage.getItem(lsKey("onboarded", userId!)) === "true";
          setStreak(savedStreak);
          streakCountRef.current = savedStreak;
          streakDateRef.current = savedDate;
          setOnboardedState(savedOnboarded);
          onboardedRef.current = savedOnboarded;
        } catch {
          // ignore
        }
      } finally {
        loaded.current = true;
        setSyncing(false);
        setProgressReady(true);
      }
    }

    loadProgress();
  }, [userId]);

  // ── Persist state changes ─────────────────────────────────────────────────

  useEffect(() => {
    if (!userId || !loaded.current) return;
    localStorage.setItem(lsKey("checked", userId), JSON.stringify(checked));
    scheduleUpsert(checked, notesRef.current, submissionsRef.current, streakCountRef.current, streakDateRef.current);
  }, [checked, userId, scheduleUpsert]);

  useEffect(() => {
    if (!userId || !loaded.current) return;
    localStorage.setItem(lsKey("notes", userId), JSON.stringify(notes));
    scheduleUpsert(checkedRef.current, notes, submissionsRef.current, streakCountRef.current, streakDateRef.current);
  }, [notes, userId, scheduleUpsert]);

  useEffect(() => {
    if (!userId || !loaded.current) return;
    localStorage.setItem(lsKey("submissions", userId), JSON.stringify(submissions));
    scheduleUpsert(checkedRef.current, notesRef.current, submissions, streakCountRef.current, streakDateRef.current);
  }, [submissions, userId, scheduleUpsert]);

  // ── setSubmission helper ──────────────────────────────────────────────────

  const setSubmission = useCallback((id: string, data: Submission) => {
    setSubmissions((prev) => ({ ...prev, [id]: data }));
  }, []);

  // ── setOnboarded ──────────────────────────────────────────────────────────

  const setOnboarded = useCallback(async () => {
    setOnboardedState(true);
    onboardedRef.current = true;
    if (!userId) return;
    localStorage.setItem(lsKey("onboarded", userId), "true");
    try {
      await supabase.from("user_progress").upsert(
        { user_id: userId, onboarded: true, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    } catch {
      // silent fail — the next debounced upsert will carry the flag
    }
  }, [userId]);

  // ── bumpStreak ────────────────────────────────────────────────────────────

  const bumpStreak = useCallback(() => {
    if (!userId) return;
    const today = getTodayStr();
    if (streakDateRef.current === today) return;

    const prevDate = streakDateRef.current;
    const next = prevDate === getYesterdayStr() ? streakCountRef.current + 1 : 1;

    streakDateRef.current = today;
    streakCountRef.current = next;

    localStorage.setItem(lsKey("streak_date", userId), today);
    localStorage.setItem(lsKey("streak_count", userId), String(next));

    setStreak(next);
    scheduleUpsert(checkedRef.current, notesRef.current, submissionsRef.current, next, today);
  }, [userId, scheduleUpsert]);

  // ── saveNow (immediate flush, cancels any pending debounce) ─────────────────

  const saveNow = useCallback(async () => {
    if (!userId || !loaded.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSyncing(true);
    try {
      await supabase.from("user_progress").upsert(
        {
          user_id: userId,
          checked: checkedRef.current,
          notes: notesRef.current,
          submissions: submissionsRef.current,
          onboarded: onboardedRef.current,
          streak_count: streakCountRef.current,
          streak_date: streakDateRef.current,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch {
      // silent fail
    } finally {
      setSyncing(false);
    }
  }, [userId]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    checked, setChecked,
    notes, setNotes,
    submissions, setSubmission,
    streak, bumpStreak,
    syncing, saveNow,
    onboarded, progressReady, setOnboarded,
  };
}
