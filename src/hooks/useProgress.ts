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

// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressState {
  checked: Record<string, boolean>;
  setChecked: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  streak: number;
  bumpStreak: () => void;
  syncing: boolean;
}

export function useProgress(userId: string | null): ProgressState {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Refs that hold state we don't want to trigger re-renders for
  const loaded = useRef(false);
  const streakDateRef = useRef<string | null>(null);
  const streakCountRef = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    loaded.current = false;

    async function loadProgress() {
      setSyncing(true);
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("checked, notes, streak_count, streak_date")
          .eq("user_id", userId!)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Supabase is the source of truth
          const remoteChecked = (data.checked ?? {}) as Record<string, boolean>;
          const remoteNotes = (data.notes ?? {}) as Record<string, string>;
          const remoteStreak = data.streak_count ?? 0;
          const remoteDate = data.streak_date ?? null;

          setChecked(remoteChecked);
          setNotes(remoteNotes);
          setStreak(remoteStreak);
          streakCountRef.current = remoteStreak;
          streakDateRef.current = remoteDate;

          // Sync to localStorage as cache
          localStorage.setItem(lsKey("checked", userId!), JSON.stringify(remoteChecked));
          localStorage.setItem(lsKey("notes", userId!), JSON.stringify(remoteNotes));
          localStorage.setItem(lsKey("streak_count", userId!), String(remoteStreak));
          if (remoteDate) localStorage.setItem(lsKey("streak_date", userId!), remoteDate);
        } else {
          // No Supabase record yet — fall back to localStorage
          try {
            const saved = localStorage.getItem(lsKey("checked", userId!));
            if (saved) setChecked(JSON.parse(saved));
            const savedNotes = localStorage.getItem(lsKey("notes", userId!));
            if (savedNotes) setNotes(JSON.parse(savedNotes));
            const savedStreak = parseInt(localStorage.getItem(lsKey("streak_count", userId!)) ?? "0");
            const savedDate = localStorage.getItem(lsKey("streak_date", userId!)) ?? null;
            setStreak(savedStreak);
            streakCountRef.current = savedStreak;
            streakDateRef.current = savedDate;
          } catch {
            // ignore parse errors — start fresh
          }
        }
      } catch {
        // Supabase unreachable — fall back to localStorage silently
        try {
          const saved = localStorage.getItem(lsKey("checked", userId!));
          if (saved) setChecked(JSON.parse(saved));
          const savedNotes = localStorage.getItem(lsKey("notes", userId!));
          if (savedNotes) setNotes(JSON.parse(savedNotes));
          const savedStreak = parseInt(localStorage.getItem(lsKey("streak_count", userId!)) ?? "0");
          const savedDate = localStorage.getItem(lsKey("streak_date", userId!)) ?? null;
          setStreak(savedStreak);
          streakCountRef.current = savedStreak;
          streakDateRef.current = savedDate;
        } catch {
          // ignore
        }
      } finally {
        loaded.current = true;
        setSyncing(false);
      }
    }

    loadProgress();
  }, [userId]);

  // ── Debounced Supabase upsert ───────────────────────────────────────────────
  const scheduleUpsert = useCallback(
    (
      nextChecked: Record<string, boolean>,
      nextNotes: Record<string, string>,
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

  // ── Persist checked changes ─────────────────────────────────────────────────
  // We use a ref snapshot approach so the effect only fires on real changes
  const checkedRef = useRef(checked);
  checkedRef.current = checked;

  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    if (!userId || !loaded.current) return;
    localStorage.setItem(lsKey("checked", userId), JSON.stringify(checked));
    scheduleUpsert(checked, notesRef.current, streakCountRef.current, streakDateRef.current);
  }, [checked, userId, scheduleUpsert]);

  useEffect(() => {
    if (!userId || !loaded.current) return;
    localStorage.setItem(lsKey("notes", userId), JSON.stringify(notes));
    scheduleUpsert(checkedRef.current, notes, streakCountRef.current, streakDateRef.current);
  }, [notes, userId, scheduleUpsert]);

  // ── bumpStreak ──────────────────────────────────────────────────────────────
  const bumpStreak = useCallback(() => {
    if (!userId) return;
    const today = getTodayStr();
    if (streakDateRef.current === today) return; // already bumped today

    const prevDate = streakDateRef.current;
    const next = prevDate === getYesterdayStr() ? streakCountRef.current + 1 : 1;

    streakDateRef.current = today;
    streakCountRef.current = next;

    localStorage.setItem(lsKey("streak_date", userId), today);
    localStorage.setItem(lsKey("streak_count", userId), String(next));

    setStreak(next);
    scheduleUpsert(checkedRef.current, notesRef.current, next, today);
  }, [userId, scheduleUpsert]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { checked, setChecked, notes, setNotes, streak, bumpStreak, syncing };
}
