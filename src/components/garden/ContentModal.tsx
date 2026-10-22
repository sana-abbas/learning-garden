import { useRef, useState } from "react";
import { Check, Copy, Lightbulb, Plus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import type { SubmissionGate } from "@/components/garden/SubmissionModal";
import type { Submission } from "@/hooks/useProgress";
import { EXERCISE_CHECKERS, type CheckResult } from "@/data/exercise-checkers";

interface Props {
  title: string;
  content: string;
  onClose: () => void;
  gate?: SubmissionGate;
  subId?: string;
  existing?: Submission;
  onSubmit?: (data: Submission) => void;
  /** Revealed one at a time; the count lives with the caller so it persists. */
  hints?: string[];
  hintsRevealed?: number;
  onRevealHint?: () => void;
}

type CodeFile = { name: string; code: string };

/** Code block with a copy button — the starter kit is meant to be copied. */
function CopyablePre({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = ref.current?.innerText ?? "";
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="relative">
      <pre ref={ref}>{children}</pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium"
        style={{ background: "oklch(0.25 0.02 260)", color: "oklch(0.92 0.03 145)" }}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children))
    return children.map((c) => (typeof c === "string" ? c : "")).join("");
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
      return (
        <p className="cf-exercise">
          <strong>{children}</strong>
        </p>
      );
    }
    return <p>{children}</p>;
  },
  img({ src, alt }: { src?: string; alt?: string }) {
    if (src?.includes("stack-") || src?.includes("queue-")) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            margin: "0.75rem 0",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{ maxWidth: "400px", width: "100%", height: "auto", borderRadius: "8px" }}
          />
          {alt && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.78rem",
                color: "var(--muted-foreground)",
              }}
            >
              {alt}
            </span>
          )}
        </div>
      );
    }
    return <img src={src} alt={alt} />;
  },
  pre: CopyablePre,
};

/** Hints are one-liners: render inline code and emphasis, but no paragraph. */
const hintComponents = {
  p({ children }: { children?: ReactNode }) {
    return <>{children}</>;
  },
};

function isValidUrl(val: string) {
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
}

function matchesDomain(val: string, domains: string[]) {
  try {
    const hostname = new URL(val).hostname.toLowerCase();
    return domains.some((d) => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

export function ContentModal({
  title,
  content,
  onClose,
  gate,
  subId,
  existing,
  onSubmit,
  hints,
  hintsRevealed = 0,
  onRevealHint,
}: Props) {
  const [paste, setPaste] = useState(existing?.paste ?? "");
  const [link, setLink] = useState(existing?.link ?? "");
  const [link2, setLink2] = useState(existing?.link2 ?? "");
  const [video, setVideo] = useState(existing?.video ?? "");
  const [files, setFiles] = useState<CodeFile[]>(
    existing?.files?.length ? existing.files : [{ name: "", code: "" }],
  );
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedWithHint, setSubmittedWithHint] = useState(false);
  const [submittedUnchecked, setSubmittedUnchecked] = useState(false);

  const pasteTrimmed = paste.trim();
  const linkTrimmed = link.trim();
  const link2Trimmed = link2.trim();

  const pasteOk = !gate?.pasteLabel || pasteTrimmed !== "";
  const linkValidUrl = linkTrimmed !== "" && isValidUrl(linkTrimmed);
  const linkDomainOk =
    !gate?.linkDomains || !linkValidUrl || matchesDomain(linkTrimmed, gate.linkDomains);
  const linkOk = !gate?.linkLabel || (linkValidUrl && linkDomainOk);
  const link2ValidUrl = link2Trimmed !== "" && isValidUrl(link2Trimmed);
  const link2DomainOk =
    !gate?.link2Domains || !link2ValidUrl || matchesDomain(link2Trimmed, gate.link2Domains!);
  const link2Ok = !gate?.link2Label || (link2ValidUrl && link2DomainOk);
  const videoTrimmed = video.trim();
  const videoValidUrl = videoTrimmed !== "" && isValidUrl(videoTrimmed);
  const videoOk = !gate?.videoLabel || videoValidUrl;
  // Untouched boxes are dropped; every file with code needs a name.
  const filledFiles = files
    .map((f) => ({ name: f.name.trim(), code: f.code.trim() }))
    .filter((f) => f.name || f.code);
  const unnamedFile = filledFiles.some((f) => f.code && !f.name);
  const filesOk =
    !gate?.filesLabel || (filledFiles.length > 0 && filledFiles.every((f) => f.name && f.code));
  const canSubmit = pasteOk && linkOk && link2Ok && videoOk && filesOk;

  const updateFile = (index: number, patch: Partial<CodeFile>) =>
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  const shownHints = hints ? Math.min(hintsRevealed, hints.length) : 0;

  const handleSubmit = () => {
    if (!canSubmit || !onSubmit || !gate) return;

    // Run checker if one exists for this subtask
    const checker = subId ? EXERCISE_CHECKERS[subId] : undefined;
    let advisory = false;
    if (checker && gate.pasteLabel) {
      const result = checker(pasteTrimmed);
      setCheckResult(result);
      // Only block when the checker can prove the answer wrong. Advisory
      // results show the hint but let the student through for mentor review.
      if (!result.correct && result.blocking !== false) return;
      advisory = !result.correct;
    }

    const data: Submission = { submittedAt: new Date().toISOString() };
    if (gate.pasteLabel) data.paste = pasteTrimmed;
    if (gate.linkLabel) data.link = linkTrimmed;
    if (gate.link2Label) data.link2 = link2Trimmed;
    if (gate.videoLabel) data.video = videoTrimmed;
    if (gate.filesLabel) data.files = filledFiles;
    onSubmit(data);
    setSubmittedWithHint(advisory);
    // Without a checker nothing was verified, so don't call it "correct".
    setSubmittedUnchecked(!checker);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />

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

          {/* Hints, one at a time — try for real before opening one */}
          {hints && hints.length > 0 && (
            <div
              className="mt-6 pt-5 border-t space-y-2.5"
              style={{ borderColor: "var(--sidebar-border)" }}
            >
              <p
                className="text-[11px] uppercase tracking-wider font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                Stuck?
              </p>
              {hints.slice(0, shownHints).map((hint, i) => (
                <div
                  key={hint}
                  className="prose-cf px-3 py-2.5 rounded-lg text-[12.5px] leading-relaxed"
                  style={{
                    background: "oklch(0.94 0.08 85 / 0.25)",
                    border: "1px solid oklch(0.7 0.14 80 / 0.4)",
                    color: "var(--foreground)",
                  }}
                >
                  <strong>Hint {i + 1}: </strong>
                  <ReactMarkdown components={hintComponents}>{hint}</ReactMarkdown>
                </div>
              ))}
              {shownHints < hints.length ? (
                <button
                  type="button"
                  onClick={onRevealHint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    border: "1px solid var(--sidebar-border)",
                    color: "var(--foreground)",
                  }}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {shownHints === 0 ? "Show a hint" : "Show the next hint"}
                  <span style={{ color: "var(--muted-foreground)" }}>
                    ({shownHints} of {hints.length})
                  </span>
                </button>
              ) : (
                <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  That's every hint for this milestone. Your mentor can help with the rest.
                </p>
              )}
            </div>
          )}

          {/* Submission form */}
          {gate && onSubmit && !submitted && (
            <div
              className="mt-6 pt-5 border-t space-y-3"
              style={{ borderColor: "var(--sidebar-border)" }}
            >
              <p
                className="text-[11px] uppercase tracking-wider font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
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
                    onChange={(e) => {
                      setPaste(e.target.value);
                      setCheckResult(null);
                    }}
                    className="w-full text-sm px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--background)",
                      borderColor: "var(--sidebar-border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              )}

              {gate.filesLabel && (
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {gate.filesLabel}
                  </p>
                  {files.map((file, i) => (
                    <div
                      // Rows have no stable id; order only changes on remove.
                      key={i}
                      className="space-y-1.5 p-2.5 rounded-lg border"
                      style={{ borderColor: "var(--sidebar-border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          aria-label={`File ${i + 1} name`}
                          placeholder="File name, e.g. main.js"
                          value={file.name}
                          onChange={(e) => updateFile(i, { name: e.target.value })}
                          className="flex-1 text-sm font-mono px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2"
                          style={{
                            background: "var(--background)",
                            borderColor: "var(--sidebar-border)",
                            color: "var(--foreground)",
                          }}
                        />
                        {files.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove file ${i + 1}`}
                            onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={6}
                        aria-label={`File ${i + 1} code`}
                        placeholder="Paste this file's code here…"
                        value={file.code}
                        onChange={(e) => updateFile(i, { code: e.target.value })}
                        className="w-full text-[13px] font-mono px-3 py-2 rounded-lg border resize-y focus:outline-none focus:ring-2"
                        style={{
                          background: "var(--background)",
                          borderColor: "var(--sidebar-border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => [...prev, { name: "", code: "" }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{
                      border: "1px dashed var(--sidebar-border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add another file
                  </button>
                  {unnamedFile && (
                    <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
                      Give every file a name, e.g. account.js
                    </p>
                  )}
                </div>
              )}

              {gate.videoLabel && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="content-modal-video"
                    className="text-xs font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {gate.videoLabel}
                  </label>
                  <input
                    id="content-modal-video"
                    type="url"
                    placeholder="https://"
                    value={video}
                    onChange={(e) => setVideo(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--background)",
                      borderColor: "var(--sidebar-border)",
                      color: "var(--foreground)",
                    }}
                  />
                  {videoTrimmed && !videoValidUrl && (
                    <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
                      Please enter a valid URL
                    </p>
                  )}
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
                    <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
                      Please enter a valid URL
                    </p>
                  )}
                  {linkValidUrl && !linkDomainOk && gate.linkDomains && (
                    <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
                      Link must be from: {gate.linkDomains.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Checker feedback — pass, a hint you can submit past, or a hard stop */}
              {checkResult &&
                (() => {
                  const tone = checkResult.correct
                    ? {
                        bg: "oklch(0.91 0.07 145 / 0.25)",
                        fg: "var(--primary)",
                        border: "oklch(0.55 0.13 145 / 0.3)",
                        icon: "✓ ",
                      }
                    : checkResult.blocking === false
                      ? {
                          bg: "oklch(0.94 0.08 85 / 0.25)",
                          fg: "oklch(0.45 0.12 70)",
                          border: "oklch(0.7 0.14 80 / 0.4)",
                          icon: "💡 ",
                        }
                      : {
                          bg: "oklch(0.93 0.07 25 / 0.2)",
                          fg: "var(--destructive)",
                          border: "oklch(0.6 0.22 25 / 0.3)",
                          icon: "✗ ",
                        };
                  return (
                    <div
                      className="px-3 py-2.5 rounded-lg text-[12.5px] font-medium space-y-1"
                      style={{
                        background: tone.bg,
                        color: tone.fg,
                        border: `1px solid ${tone.border}`,
                      }}
                    >
                      <div>
                        {tone.icon}
                        {checkResult.feedback}
                      </div>
                      {!checkResult.correct && checkResult.blocking === false && (
                        <div className="font-normal opacity-80">
                          You can still submit — your mentor will take a look.
                        </div>
                      )}
                    </div>
                  );
                })()}

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
              <div className="text-4xl">
                {submittedWithHint || submittedUnchecked ? "🌱" : "🎉"}
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                  {submittedWithHint || submittedUnchecked
                    ? "Submitted — nice work!"
                    : "That's correct! Great job!"}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {submittedUnchecked && !submittedWithHint
                    ? "Your work is saved and your mentor will review it. You can come back and update it any time. 🌱"
                    : submittedWithHint
                      ? "Your answer is saved and your mentor will review it. Have another look at the hint above if you'd like to refine it — you can come back and update your answer any time. 🌱"
                      : "You've completed this exercise. Keep up the amazing work. Every exercise you finish is a step forward. You're doing brilliantly! 🌱"}
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
