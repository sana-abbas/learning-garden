import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Video, CheckCircle2 } from "lucide-react";
import type { Submission } from "@/hooks/useProgress";

export interface SubmissionGate {
  linkLabel?: string;      // first link field label
  link2Label?: string;     // second link field label (e.g. "Live demo URL")
  videoLabel?: string;     // video field label
  linkDomains?: string[];  // allowed domains for first link
  link2Domains?: string[]; // allowed domains for second link
}

interface Props {
  open: boolean;
  subtaskLabel: string;
  gate: SubmissionGate;
  existing?: Submission;
  onSubmit: (data: Submission) => void;
  onClose: () => void;
}

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

function domainError(domains: string[]) {
  return `Link must be from: ${domains.join(", ")}`;
}

export function SubmissionModal({ open, subtaskLabel, gate, existing, onSubmit, onClose }: Props) {
  const [link, setLink] = useState(existing?.link ?? "");
  const [link2, setLink2] = useState(existing?.link2 ?? "");
  const [video, setVideo] = useState(existing?.video ?? "");

  const linkTrimmed = link.trim();
  const link2Trimmed = link2.trim();
  const videoTrimmed = video.trim();

  const linkValidUrl = linkTrimmed !== "" && isValidUrl(linkTrimmed);
  const linkDomainOk = !gate.linkDomains || !linkValidUrl || matchesDomain(linkTrimmed, gate.linkDomains);
  const linkOk = !gate.linkLabel || (linkValidUrl && linkDomainOk);

  const link2ValidUrl = link2Trimmed !== "" && isValidUrl(link2Trimmed);
  const link2DomainOk = !gate.link2Domains || !link2ValidUrl || matchesDomain(link2Trimmed, gate.link2Domains);
  const link2Ok = !gate.link2Label || (link2ValidUrl && link2DomainOk);

  const videoOk = !gate.videoLabel || (videoTrimmed !== "" && isValidUrl(videoTrimmed));

  const canSubmit = linkOk && link2Ok && videoOk;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const data: Submission = { submittedAt: new Date().toISOString() };
    if (gate.linkLabel) data.link = linkTrimmed;
    if (gate.link2Label) data.link2 = link2Trimmed;
    if (gate.videoLabel) data.video = videoTrimmed;
    onSubmit(data);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-0 p-0 overflow-hidden bg-transparent shadow-none">
        <div
          className="relative rounded-3xl p-8"
          style={{
            background: "linear-gradient(160deg, oklch(0.97 0.04 90) 0%, oklch(0.93 0.06 130) 100%)",
            boxShadow: "var(--shadow-bloom)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Icon */}
          <div
            className="mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--leaf-light))",
              boxShadow: "0 0 40px oklch(0.6 0.16 145 / 0.4)",
            }}
          >
            <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={1.8} />
          </div>

          <DialogHeader className="space-y-2 mb-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
              Submit your work
            </p>
            <DialogTitle className="text-xl font-serif tracking-tight text-[color:var(--foreground)] leading-snug">
              {subtaskLabel}
            </DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--muted-foreground)] leading-relaxed">
              Share your work before marking this complete.
              {existing?.submittedAt && (
                <span className="block mt-1 text-[color:var(--primary)]">
                  You submitted this before — update the link if needed.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Fields */}
          <div className="space-y-4">
            {gate.linkLabel && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--foreground)]">
                  <Link className="w-3.5 h-3.5 text-[color:var(--primary)]" />
                  {gate.linkLabel}
                </Label>
                <Input
                  type="url"
                  placeholder="https://"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="text-sm bg-white/60 dark:bg-[oklch(0.22_0.03_65)] border-[color:var(--border)] focus-visible:ring-[color:var(--primary)]/30"
                />
                {linkTrimmed && !linkValidUrl && (
                  <p className="text-[11px] text-[color:var(--destructive)]">Please enter a valid URL</p>
                )}
                {linkValidUrl && !linkDomainOk && gate.linkDomains && (
                  <p className="text-[11px] text-[color:var(--destructive)]">{domainError(gate.linkDomains)}</p>
                )}
              </div>
            )}

            {gate.link2Label && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--foreground)]">
                  <Link className="w-3.5 h-3.5 text-[color:var(--primary)]" />
                  {gate.link2Label}
                </Label>
                <Input
                  type="url"
                  placeholder="https://"
                  value={link2}
                  onChange={(e) => setLink2(e.target.value)}
                  className="text-sm bg-white/60 dark:bg-[oklch(0.22_0.03_65)] border-[color:var(--border)] focus-visible:ring-[color:var(--primary)]/30"
                />
                {link2Trimmed && !link2ValidUrl && (
                  <p className="text-[11px] text-[color:var(--destructive)]">Please enter a valid URL</p>
                )}
                {link2ValidUrl && !link2DomainOk && gate.link2Domains && (
                  <p className="text-[11px] text-[color:var(--destructive)]">{domainError(gate.link2Domains)}</p>
                )}
              </div>
            )}

            {gate.videoLabel && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--foreground)]">
                  <Video className="w-3.5 h-3.5 text-[color:var(--bloom-pink)]" />
                  {gate.videoLabel}
                </Label>
                <Input
                  type="url"
                  placeholder="https://loom.com/share/... or YouTube link"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  className="text-sm bg-white/60 dark:bg-[oklch(0.22_0.03_65)] border-[color:var(--border)] focus-visible:ring-[color:var(--primary)]/30"
                />
                {videoTrimmed && !isValidUrl(videoTrimmed) && (
                  <p className="text-[11px] text-[color:var(--destructive)]">Please enter a valid URL</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-7 flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 rounded-full text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 h-11 rounded-full border-0 font-medium disabled:opacity-40"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, var(--primary), var(--leaf))"
                  : undefined,
                color: "white",
              }}
            >
              Submit &amp; complete
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
