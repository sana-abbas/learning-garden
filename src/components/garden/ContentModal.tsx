import { useState } from "react";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import type { SubmissionGate } from "@/components/garden/SubmissionModal";
import type { Submission } from "@/hooks/useProgress";
import { EXERCISE_CHECKERS } from "@/data/exercise-checkers";

interface Props {
  title: string;
  content: string;
  onClose: () => void;
  gate?: SubmissionGate;
  subId?: string;
  existing?: Submission;
  onSubmit?: (data: Submission) => void;
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(c => (typeof c === "string" ? c : "")).join("");
  return "";
}

const mdComponents = {
  p({ children }: { children?: ReactNode }) {
    const text = extractText(children);
    if (text.startsWith("💡")) return <p className="cf-deepdive">{children}</p>;
    if (text.startsWith("📝")) {
      const nlIdx = text.indexOf("\n");
      if (nlIdx > -1) {
        const title = text.slice(0, nlIdx);
        const body = text.slice(nlIdx + 1);
        return (
          <p className="cf-exercise">
            <strong>{title}</strong>
            <br />
            {body}
          </p>
        );
      }
      return <p className="cf-exercise"><strong>{children}</strong></p>;
    }
    return <p>{children}</p>;
  },
  img({ src, alt }: { src?: string; alt?: string }) {
    if (src?.includes("stack-") || src?.includes("queue-")) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", margin: "0.75rem 0" }}>
          <img src={src} alt={alt} style={{ maxWidth: "400px", width: "100%", height: "auto", borderRadius: "8px" }} />
          {alt && (
            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>
              {alt}
            </span>
          )}
        </div>
      );
    }
    return <img src={src} alt={alt} />;
  },
};

function isValidUrl(val: string) {
  try { new URL(val); return true; } catch { return false; }
}

function matchesDomain(val: string, domains: string[]) {
  try {
    const hostname = new URL(val).hostname.toLowerCase();
    return domains.some((d) => hostname === d || hostname.endsWith("." + d));
  } catch { return false; }
}

export function ContentModal({ title, content, onClose, gate, subId, existing, onSubmit }: Props) {
  const [paste, setPaste] = useState(existing?.paste ?? "");
  const [link, setLink] = useState(existing?.link ?? "");
  const [link2, setLink2] = useState(existing?.link2 ?? "");
  const [checkResult, setCheckResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pasteTrimmed = paste.trim();
  const linkTrimmed = link.trim();
  const link2Trimmed = link2.trim();

  const pasteOk = !gate?.pasteLabel || pasteTrimmed !== "";
  const linkValidUrl = linkTrimmed !== "" && isValidUrl(linkTrimmed);
  const linkDomainOk = !gate?.linkDomains || !linkValidUrl || matchesDomain(linkTrimmed, gate.linkDomains);
  const linkOk = !gate?.linkLabel || (linkValidUrl && linkDomainOk);
  const link2ValidUrl = link2Trimmed !== "" && isValidUrl(link2Trimmed);
  const link2DomainOk = !gate?.link2Domains || !link2ValidUrl || matchesDomain(link2Trimmed, gate.link2Domains!);
  const link2Ok = !gate?.link2Label || (link2ValidUrl && link2DomainOk);
  const canSubmit = pasteOk && linkOk && link2Ok;

  const handleSubmit = () => {
    if (!canSubmit || !onSubmit || !gate) return;

    // Run checker if one exists for this subtask
    const checker = subId ? EXERCISE_CHECKERS[subId] : undefined;
    if (checker && gate.pasteLabel) {
      const result = checker(pasteTrimmed);
      setCheckResult(result);
      if (!result.correct) return; // don't mark complete until correct
    }

    const data: Submission = { submittedAt: new Date().toISOString() };
    if (gate.pasteLabel) data.paste = pasteTrimmed;
    if (gate.linkLabel) data.link = linkTrimmed;
    if (gate.link2Label) data.link2 = link2Trimmed;
    onSubmit(data);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <h2
            className="font-serif text-base font-semibold leading-snug pr-4"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="prose-cf">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {content}
            </ReactMarkdown>
          </div>

          {/* Submission form */}
          {gate && onSubmit && !submitted && (
            <div
              className="mt-6 pt-5 border-t space-y-3"
              style={{ borderColor: "var(--sidebar-border)" }}
            >
              <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>
                Submit your work
              </p>
              {existing?.submittedAt && (
                <p className="text-[11px]" style={{ color: "var(--primary)" }}>
                  Already submitted — update your answer if needed.
                </p>
              )}

              {gate.pasteLabel && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {gate.pasteLabel}
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Type or paste your answer here…"
                    value={paste}
                    onChange={(e) => { setPaste(e.target.value); setCheckResult(null); }}
                    className="w-full text-sm px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--background)",
                      borderColor: "var(--sidebar-border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              )}

              {gate.linkLabel && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {gate.linkLabel}
                  </label>
                  <input
                    type="url"
                    placeholder="https://"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--background)",
                      borderColor: "var(--sidebar-border)",
                      color: "var(--foreground)",
                    }}
                  />
                  {linkTrimmed && !linkValidUrl && (
                    <p className="text-[11px]" style={{ color: "var(--destructive)" }}>Please enter a valid URL</p>
                  )}
                  {linkValidUrl && !linkDomainOk && gate.linkDomains && (
                    <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
                      Link must be from: {gate.linkDomains.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Checker feedback */}
              {checkResult && (
                <div
                  className="px-3 py-2.5 rounded-lg text-[12.5px] font-medium"
                  style={{
                    background: checkResult.correct
                      ? "oklch(0.91 0.07 145 / 0.25)"
                      : "oklch(0.93 0.07 25 / 0.2)",
                    color: checkResult.correct
                      ? "var(--primary)"
                      : "var(--destructive)",
                    border: `1px solid ${checkResult.correct ? "oklch(0.55 0.13 145 / 0.3)" : "oklch(0.6 0.22 25 / 0.3)"}`,
                  }}
                >
                  {checkResult.correct ? "✓ " : "✗ "}{checkResult.feedback}
                </div>
              )}

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--leaf))" }}
              >
                Submit &amp; complete
              </button>
            </div>
          )}

          {/* Celebration after successful submission */}
          {gate && onSubmit && submitted && (
            <div
              className="mt-6 pt-5 border-t space-y-4 text-center"
              style={{ borderColor: "var(--sidebar-border)" }}
            >
              <div className="text-4xl">🎉</div>
              <div className="space-y-1.5">
                <p className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                  That's correct! Great job!
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  You've completed this exercise. Keep up the amazing work. Every exercise you finish is a step forward. You're doing brilliantly! 🌱
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--leaf))" }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
