import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Existing {
  today: string;
  tomorrow: string;
  blockers: string | null;
}

interface Props {
  userId: string;
  existing?: Existing | null;
  onClose: () => void;
  onSubmitted: (update: Existing) => void;
}

export function DailyUpdateModal({ userId, existing, onClose, onSubmitted }: Props) {
  const [today, setToday] = useState(existing?.today ?? "");
  const [tomorrow, setTomorrow] = useState(existing?.tomorrow ?? "");
  const [blockers, setBlockers] = useState(existing?.blockers ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = today.trim() !== "" && tomorrow.trim() !== "";
  const dateStr = new Date().toISOString().split("T")[0];
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase
      .from("daily_updates")
      .upsert(
        { user_id: userId, date: dateStr, today: today.trim(), tomorrow: tomorrow.trim(), blockers: blockers.trim() || null },
        { onConflict: "user_id,date" },
      );

    setSubmitting(false);
    if (err) {
      setError("Something went wrong. Please try again.");
    } else {
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
          <div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Daily Update
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {dateLabel}
            </p>
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
