import { useState, useRef, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Existing {
  today: string;
  tomorrow: string;
  blockers: string | null;
}

interface Props {
  userId: string;
  displayName?: string;
  existing?: Existing | null;
  onClose: () => void;
  onSubmitted: (update: Existing) => void;
}

const todayStr = () => new Date().toISOString().split("T")[0];

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun … 6 Sat
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now); mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split("T")[0],
    end:   sun.toISOString().split("T")[0],
  };
}

function weeklyMessage(posted: number, isNewSubmission: boolean) {
  const target = 5;
  const count = isNewSubmission ? Math.min(posted + 1, target) : posted;
  const remaining = target - count;
  if (count === 0) return { text: "No updates posted yet this week, let's get started! 💪", color: "var(--muted-foreground)" };
  if (remaining <= 0) return { text: "All 5 updates posted this week, amazing work! 🌟", color: "var(--primary)" };
  if (remaining === 1) return { text: `${count}/5 updates this week — just 1 more to go! 🔥`, color: "var(--primary)" };
  return { text: `${count}/5 updates posted this week — keep it up!`, color: "var(--muted-foreground)" };
}

export function DailyUpdateModal({ userId, displayName, existing, onClose, onSubmitted }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [today, setToday] = useState(existing?.today ?? "");
  const [tomorrow, setTomorrow] = useState(existing?.tomorrow ?? "");
  const [blockers, setBlockers] = useState(existing?.blockers ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [loadingDate, setLoadingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyPosted, setWeeklyPosted] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { start, end } = getWeekRange();
    supabase
      .from("daily_updates")
      .select("date")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .then(({ data }) => setWeeklyPosted(data?.length ?? 0));
  }, [userId]);

  const canSubmit = today.trim() !== "" && tomorrow.trim() !== "";
  const dateLabel = formatDateLabel(selectedDate);
  const isToday = selectedDate === todayStr();

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    setLoadingDate(true);
    setError(null);
    const { data } = await supabase
      .from("daily_updates")
      .select("today, tomorrow, blockers")
      .eq("user_id", userId)
      .eq("date", newDate)
      .maybeSingle();
    setToday(data?.today ?? "");
    setTomorrow(data?.tomorrow ?? "");
    setBlockers(data?.blockers ?? "");
    setLoadingDate(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase
      .from("daily_updates")
      .upsert(
        { user_id: userId, date: selectedDate, today: today.trim(), tomorrow: tomorrow.trim(), blockers: blockers.trim() || null, display_name: displayName ?? null },
        { onConflict: "user_id,date" },
      );

    setSubmitting(false);
    if (err) {
      setError("Something went wrong. Please try again.");
    } else {
      // If this was a new post (not an edit), bump the weekly count
      const wasNew = !existing && weeklyPosted !== null;
      if (wasNew) setWeeklyPosted((n) => Math.min((n ?? 0) + 1, 5));
      onSubmitted({ today: today.trim(), tomorrow: tomorrow.trim(), blockers: blockers.trim() || null });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Daily Update
            </h2>
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className="flex items-center gap-1 mt-0.5 group"
            >
              <Calendar className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
              <span className="text-[11px] group-hover:underline" style={{ color: isToday ? "var(--muted-foreground)" : "var(--primary)" }}>
                {isToday ? dateLabel : `${dateLabel} (past)`}
              </span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => e.target.value && handleDateChange(e.target.value)}
              className="sr-only"
            />
            {weeklyPosted !== null && (() => {
              const msg = weeklyMessage(weeklyPosted, false);
              return (
                <p className="text-[11px] mt-1 font-medium" style={{ color: msg.color }}>
                  {msg.text}
                </p>
              );
            })()}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
              What did I do today? <span style={{ color: "var(--destructive)" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Share what you worked on today…"
              value={today}
              onChange={(e) => setToday(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2"
              style={{ background: "var(--background)", borderColor: "var(--sidebar-border)", color: "var(--foreground)" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
              What will I do tomorrow? <span style={{ color: "var(--destructive)" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="What are you planning for tomorrow…"
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2"
              style={{ background: "var(--background)", borderColor: "var(--sidebar-border)", color: "var(--foreground)" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
              Anything blocking me?{" "}
              <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Any blockers or challenges…"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2"
              style={{ background: "var(--background)", borderColor: "var(--sidebar-border)", color: "var(--foreground)" }}
            />
          </div>

          {loadingDate && (
            <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>Loading update for selected date…</p>
          )}
          {error && (
            <p className="text-[12px]" style={{ color: "var(--destructive)" }}>{error}</p>
          )}

          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--leaf))" }}
          >
            {submitting ? "Submitting…" : existing ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
