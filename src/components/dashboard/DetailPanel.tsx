import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  Link as LinkIcon,
  MessageCircle,
  Video,
  X,
} from "lucide-react";
import type { ParticipantRow } from "./types";
import { displayName, timeAgo } from "./format";
import { completionFor, curriculumFor, stepsFor } from "./progress";
import { Avatar } from "./Avatar";

/** Full progress, submissions and reflections for one participant. */
export function DetailPanel({
  participant,
  cohortSlug,
  onClose,
}: {
  participant: ParticipantRow;
  cohortSlug: string;
  onClose: () => void;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const steps = stepsFor(cohortSlug);
  const curriculumSteps = curriculumFor(cohortSlug);
  const completion = completionFor(cohortSlug, participant.checked);
  const completedCount = curriculumSteps.filter((s) => completion[s.id]).length;

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chaptersWithNotes = steps.filter((s) => participant.notes[s.id]);
  const allSubmissions = steps.flatMap((s) =>
    (s.subtasks ?? []).flatMap((sub) => {
      const submission = participant.submissions[sub.id];
      return submission ? [{ step: s, sub, submission }] : [];
    }),
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-xl h-full flex flex-col overflow-hidden"
        style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--sidebar-border)" }}
      >
        <div className="shrink-0 p-6 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar row={participant} size="lg" />
              <div>
                <p className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                  {displayName(participant)}
                </p>
                {participant.email && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {participant.email}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  {completedCount}/{curriculumSteps.length} chapters · last active{" "}
                  {timeAgo(participant.updated_at)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "oklch(0.88 0.04 85)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${curriculumSteps.length ? (completedCount / curriculumSteps.length) * 100 : 0}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {allSubmissions.length > 0 && (
            <section>
              <SectionLabel>Submitted assignments</SectionLabel>
              <div className="space-y-2">
                {allSubmissions.map(({ step, sub, submission }) => (
                  <div
                    key={sub.id}
                    className="rounded-xl p-3 space-y-1.5"
                    style={{
                      background: "oklch(0.97 0.02 130 / 0.5)",
                      border: "1px solid oklch(0.85 0.06 145 / 0.3)",
                    }}
                  >
                    <p
                      className="text-[11px] font-medium leading-snug"
                      style={{ color: "var(--foreground)" }}
                    >
                      {step.title} — {sub.label}
                    </p>
                    {[submission.link, submission.link2].filter(Boolean).map((href) => (
                      <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] hover:underline"
                        style={{ color: "var(--primary)" }}
                      >
                        <LinkIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{href}</span>
                      </a>
                    ))}
                    {submission.video && (
                      <a
                        href={submission.video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] hover:underline"
                        style={{ color: "var(--bloom-magenta)" }}
                      >
                        <Video className="w-3 h-3 shrink-0" />
                        <span className="truncate">{submission.video}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {chaptersWithNotes.length > 0 && (
            <section>
              <SectionLabel>Reflection notes</SectionLabel>
              <div className="space-y-2">
                {chaptersWithNotes.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl p-3"
                    style={{
                      background: "oklch(0.96 0.03 90 / 0.7)",
                      border: "1px solid var(--sidebar-border)",
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "var(--primary)" }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="text-[12.5px] leading-relaxed italic"
                      style={{ color: "var(--foreground)" }}
                    >
                      “{participant.notes[step.id]}”
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionLabel>Chapter progress</SectionLabel>
            <div className="space-y-2">
              {steps.map((step) => {
                const isCall = step.kind === "call";
                const isDone = completion[step.id];
                const isOpen = openIds.has(step.id);
                const hasSubs = !!step.subtasks?.length;
                const note = participant.notes[step.id];
                const callSub = participant.submissions[step.id];
                const subDone = hasSubs
                  ? step.subtasks!.filter((s) => participant.checked[s.id]).length
                  : 0;

                return (
                  <div
                    key={step.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: isDone ? "oklch(0.7 0.15 145 / 0.3)" : "var(--sidebar-border)",
                      background: isDone ? "var(--sidebar-accent)" : "transparent",
                    }}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                      onClick={() => hasSubs && toggleOpen(step.id)}
                    >
                      {isDone ? (
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: "var(--primary)" }}
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4 shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--foreground)" }}
                          >
                            {step.title}
                          </span>
                          {isCall && (
                            <span
                              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                              style={{
                                background: "oklch(0.94 0.04 340)",
                                color: "var(--bloom-magenta)",
                              }}
                            >
                              Call
                            </span>
                          )}
                        </div>
                        {hasSubs && (
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {subDone}/{step.subtasks!.length} tasks
                          </span>
                        )}
                        {isCall && callSub?.claimedAt && (
                          <span className="text-[11px]" style={{ color: "var(--primary)" }}>
                            Claimed{" "}
                            {new Date(callSub.claimedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      {hasSubs && (
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      )}
                    </button>

                    {hasSubs && isOpen && (
                      <div
                        className="px-4 pb-4 pt-1 border-t space-y-3"
                        style={{ borderColor: "var(--sidebar-border)" }}
                      >
                        <ul className="space-y-1 pt-2">
                          {step.subtasks!.map((sub) => {
                            const subChecked = !!participant.checked[sub.id];
                            const subSubmission = participant.submissions[sub.id];
                            return (
                              <li key={sub.id} className="flex items-start gap-2 py-1">
                                {subChecked ? (
                                  <CheckCircle2
                                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                    style={{ color: "var(--primary)" }}
                                  />
                                ) : (
                                  <Circle
                                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                    style={{ color: "var(--muted-foreground)" }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span
                                    className="text-[12.5px] leading-snug"
                                    style={{
                                      color: subChecked
                                        ? "var(--muted-foreground)"
                                        : "var(--sidebar-foreground)",
                                      textDecoration: subChecked ? "line-through" : "none",
                                    }}
                                  >
                                    {sub.label}
                                  </span>
                                  {subSubmission && (
                                    <div className="mt-1 space-y-0.5">
                                      {[subSubmission.link, subSubmission.link2]
                                        .filter(Boolean)
                                        .map((href) => (
                                          <a
                                            key={href}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[11px] hover:underline"
                                            style={{ color: "var(--primary)" }}
                                          >
                                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                            <span className="truncate">{href}</span>
                                          </a>
                                        ))}
                                      {subSubmission.video && (
                                        <a
                                          href={subSubmission.video}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] hover:underline"
                                          style={{ color: "var(--bloom-magenta)" }}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                          Video
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        {note && (
                          <div
                            className="rounded-xl p-3"
                            style={{
                              background: "oklch(0.95 0.03 85)",
                              border: "1px solid var(--sidebar-border)",
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <MessageCircle
                                className="w-3 h-3"
                                style={{ color: "var(--primary)" }}
                              />
                              <span
                                className="text-[10px] uppercase tracking-wider font-medium"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Reflection
                              </span>
                            </div>
                            <p
                              className="text-[12.5px] leading-relaxed italic"
                              style={{ color: "var(--foreground)" }}
                            >
                              “{note}”
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-2.5"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </p>
  );
}
