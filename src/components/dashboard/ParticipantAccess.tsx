import { useState } from "react";
import { ChevronDown, Mail, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { CohortSlug } from "@/lib/cohort";
import { addParticipant, removeParticipant } from "@/lib/participants";
import type { InviteRow, ParticipantRow } from "./types";
import { cohortLabel, displayName, timeAgo } from "./format";
import { Avatar } from "./Avatar";

/**
 * Mentor controls for who can get into the garden. The garden is invite-only:
 * adding someone puts their email on the access list for a cohort, removing
 * them takes it off and takes them out of their cohort. Progress is never
 * deleted, so a removed participant who is added back picks up where they
 * left off. See supabase/sql/2026-10-15-participant-access.sql.
 */

const COHORTS = [
  { slug: "full-stack", label: "Full Stack" },
  { slug: "coding-fundamentals", label: "Coding Fundamentals" },
] as const;

/** Splits pasted text into addresses: commas, semicolons, spaces or new lines. */
function parseEmails(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase();
    if (email) seen.add(email);
  }
  return [...seen];
}

export function AddParticipantModal({
  defaultCohort,
  defaultEmails = "",
  onClose,
  onAdded,
}: {
  defaultCohort: CohortSlug;
  defaultEmails?: string;
  onClose: () => void;
  onAdded: () => Promise<void>;
}) {
  const [emailsText, setEmailsText] = useState(defaultEmails);
  const [cohort, setCohort] = useState<CohortSlug>(defaultCohort);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const emails = parseEmails(emailsText);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (emails.length === 0 || saving) return;
    setSaving(true);
    setErrors([]);

    const failed: { email: string; message: string }[] = [];
    let enrolled = 0;
    let invited = 0;
    // One at a time, so a bad address does not stop the rest.
    for (const email of emails) {
      try {
        if ((await addParticipant(email, cohort)) === "enrolled") enrolled++;
        else invited++;
      } catch (err) {
        failed.push({
          email,
          message: err instanceof Error ? err.message : `${email} could not be added.`,
        });
      }
    }

    await onAdded();
    setSaving(false);

    const added = enrolled + invited;
    if (added > 0) {
      const parts = [
        invited > 0 && `${invited} invited`,
        enrolled > 0 && `${enrolled} with an account given access`,
      ].filter(Boolean);
      toast.success(`Added to ${cohortLabel(cohort)}: ${parts.join(", ")}`);
    }
    if (failed.length > 0) {
      // Leave only the ones that failed in the box, so they can be fixed and resent.
      setErrors(failed.map((f) => f.message));
      setEmailsText(failed.map((f) => f.email).join("\n"));
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
            Add participants
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mt-1 -mr-1 rounded-lg"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>
          They sign in with Google using this email and land in the cohort you pick. Adding someone
          who was removed restores their progress.
        </p>

        <label
          htmlFor="invite-emails"
          className="block text-[11px] uppercase tracking-[0.14em] font-semibold mb-1.5"
          style={{ color: "var(--muted-foreground)" }}
        >
          Emails
        </label>
        <textarea
          id="invite-emails"
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
          rows={4}
          placeholder={"name@example.com\nanother@example.com"}
          className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-y mb-1"
          style={{
            background: "var(--background)",
            border: "1px solid var(--sidebar-border)",
            color: "var(--foreground)",
          }}
        />
        <p className="text-[11px] mb-4" style={{ color: "var(--muted-foreground)" }}>
          One per line, or separated by commas.
        </p>

        <p
          id="invite-cohort-label"
          className="block text-[11px] uppercase tracking-[0.14em] font-semibold mb-1.5"
          style={{ color: "var(--muted-foreground)" }}
        >
          Cohort
        </p>
        <div role="group" aria-labelledby="invite-cohort-label" className="flex gap-2 mb-5">
          {COHORTS.map(({ slug, label }) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCohort(slug)}
              aria-pressed={cohort === slug}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: cohort === slug ? "var(--primary)" : "var(--background)",
                color: cohort === slug ? "white" : "var(--muted-foreground)",
                border: "1px solid var(--sidebar-border)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {errors.length > 0 && (
          <div
            className="mb-4 rounded-xl px-3 py-2.5 text-xs space-y-1"
            style={{ border: "1px solid var(--destructive)", color: "var(--foreground)" }}
          >
            {errors.map((msg) => (
              <p key={msg}>{msg}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={emails.length === 0 || saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {saving
            ? "Adding…"
            : emails.length > 1
              ? `Add ${emails.length} participants`
              : "Add participant"}
        </button>
      </form>
    </div>
  );
}

/**
 * The two lists a mentor needs besides the cards: people invited to this
 * cohort who have not signed in yet, and people who were removed.
 */
export function AccessLists({
  cohort,
  pendingInvites,
  removed,
  onAddBack,
  onChanged,
}: {
  cohort: CohortSlug;
  pendingInvites: InviteRow[];
  removed: ParticipantRow[];
  onAddBack: (email: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function withdraw(email: string) {
    setBusy(email);
    try {
      await removeParticipant(email);
      await onChanged();
      toast.success(`Invite for ${email} withdrawn`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw the invite.");
    }
    setBusy(null);
  }

  if (pendingInvites.length === 0 && removed.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {pendingInvites.length > 0 && (
        <Collapsible
          icon={Mail}
          title={`Invited to ${cohortLabel(cohort)}, not signed in yet`}
          count={pendingInvites.length}
        >
          {pendingInvites.map((invite) => (
            <Row key={invite.email}>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                  {invite.email}
                </p>
                {invite.created_at && (
                  <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    invited {timeAgo(invite.created_at)}
                  </p>
                )}
              </div>
              <SmallButton disabled={busy === invite.email} onClick={() => withdraw(invite.email)}>
                {busy === invite.email ? "Withdrawing…" : "Withdraw"}
              </SmallButton>
            </Row>
          ))}
        </Collapsible>
      )}

      {removed.length > 0 && (
        <Collapsible icon={UserMinus} title="Removed from the garden" count={removed.length}>
          {removed.map((p) => (
            <Row key={p.user_id}>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar row={p} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                    {displayName(p)}
                  </p>
                  {p.email && (
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {p.email}
                    </p>
                  )}
                </div>
              </div>
              {p.email && (
                <SmallButton onClick={() => onAddBack(p.email!)}>
                  <UserPlus className="w-3 h-3" /> Add back
                </SmallButton>
              )}
            </Row>
          ))}
        </Collapsible>
      )}
    </div>
  );
}

/** Confirm-then-remove control for the participant detail panel. */
export function RemoveParticipantButton({
  participant,
  onRemoved,
}: {
  participant: ParticipantRow;
  onRemoved: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const email = participant.email;

  if (!email) return null;

  async function remove() {
    setRemoving(true);
    try {
      await removeParticipant(email!);
      await onRemoved();
      toast.success(`${displayName(participant)} was removed from the garden`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this participant.");
      setRemoving(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{ border: "1px solid var(--sidebar-border)", color: "var(--destructive)" }}
      >
        <UserMinus className="w-3.5 h-3.5" /> Remove from garden
      </button>
    );
  }

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{ border: "1px solid var(--destructive)", color: "var(--foreground)" }}
    >
      <p className="mb-3 leading-relaxed">
        <strong>{displayName(participant)}</strong> will lose access to the garden straight away.
        Their progress, reflections and daily updates are kept, so you can add them back later.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={removing}
          onClick={remove}
          className="px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ background: "var(--destructive)" }}
        >
          {removing ? "Removing…" : "Remove"}
        </button>
        <button
          type="button"
          disabled={removing}
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-lg font-medium"
          style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Collapsible({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left"
        style={{ color: "var(--foreground)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
        <span className="font-medium flex-1">{title}</span>
        <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
          {count}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--muted-foreground)" }}
        />
      </button>
      {open && (
        <div className="border-t divide-y" style={{ borderColor: "var(--sidebar-border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5"
      style={{ borderColor: "var(--sidebar-border)" }}
    >
      {children}
    </div>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg disabled:opacity-50"
      style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
    >
      {children}
    </button>
  );
}
