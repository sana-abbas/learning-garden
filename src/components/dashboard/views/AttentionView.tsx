import { AlertTriangle, CheckCircle2, Mail, UserX } from "lucide-react";
import type { RosterRow } from "../types";
import { timeAgo } from "../format";
import { appProgress, attentionLists, idleDays, IDLE_DAYS, rosterName } from "../metrics";
import { Panel } from "../ui";

/**
 * What the Notion ↔ garden join makes visible and neither system shows alone.
 *
 * Every list here is a person somebody should contact, or a record somebody
 * should correct. Ordered so the cheapest fixes come first: someone who never
 * signed in needs one email, whereas a status mismatch needs a decision.
 */
export function AttentionView({ rows }: { rows: RosterRow[] }) {
  const lists = attentionLists(rows);

  const everythingClear =
    lists.neverSignedIn.length === 0 &&
    lists.signedInNeverStarted.length === 0 &&
    lists.idle.length === 0 &&
    lists.activeButOffboarded.length === 0 &&
    lists.missingFromRoster.length === 0 &&
    lists.graduatedButIncomplete.length === 0;

  return (
    <div className="space-y-6">
      {everythingClear && (
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: "var(--sidebar)", border: "1px solid var(--primary)" }}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
          <div>
            <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
              Nothing needs attention
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Every enrolled participant has an account and recent activity, and the roster agrees
              with the garden.
            </p>
          </div>
        </div>
      )}

      <PeoplePanel
        title="Enrolled but never signed in"
        hint="On a Full Stack or Coding Fundamentals track, marked Enrolled, with no garden account at all — usually an invitation that never landed. Other tracks are not taught in the garden, so they are excluded."
        icon={Mail}
        people={lists.neverSignedIn}
        detail={(r) => (r.start_date ? `started ${r.start_date}` : "no start date")}
      />

      <PeoplePanel
        title="Signed in but never started"
        hint="They have an account and have not completed a single chapter."
        icon={AlertTriangle}
        people={lists.signedInNeverStarted}
        detail={(r) => (r.last_active ? `last seen ${timeAgo(r.last_active)}` : "never active")}
      />

      <PeoplePanel
        title={`Started, then went quiet (${IDLE_DAYS}+ days)`}
        hint="Enrolled, made progress, and has not been back. The clearest churn signal you have."
        icon={AlertTriangle}
        people={lists.idle}
        detail={(r) => {
          const progress = appProgress(r);
          const days = idleDays(r);
          const chapters = progress ? `${progress.done}/${progress.total} chapters` : "";
          return [chapters, days !== null ? `quiet ${days} days` : ""].filter(Boolean).join(" · ");
        }}
      />

      <PeoplePanel
        title="Marked as gone, but still active"
        hint="Notion says Offboarded or Declined, yet they are using the garden. One of the two records is wrong."
        icon={UserX}
        people={lists.activeButOffboarded}
        detail={(r) =>
          `${r.status} · last active ${r.last_active ? timeAgo(r.last_active) : "never"}`
        }
      />

      <PeoplePanel
        title="Using the garden but not on the roster"
        hint="A garden account whose email matches no Notion row. Either a missing roster entry or a sign-in with a different address."
        icon={UserX}
        people={lists.missingFromRoster}
        detail={(r) => {
          const progress = appProgress(r);
          return [
            progress ? `${progress.done}/${progress.total} chapters` : "",
            r.joined_app_at ? `joined ${timeAgo(r.joined_app_at)}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
        }}
      />

      <PeoplePanel
        title="Graduated with an unfinished curriculum"
        hint="Notion says Graduated but the in-app chapters are incomplete. Only checked for the two tracks the garden teaches."
        icon={AlertTriangle}
        people={lists.graduatedButIncomplete}
        detail={(r) => {
          const progress = appProgress(r);
          return progress ? `${progress.done} of ${progress.total} chapters complete` : "";
        }}
      />
    </div>
  );
}

/**
 * A list of people with a one-line reason each, and their emails ready to
 * copy. Rendered only when it has entries — an empty panel per category would
 * bury the ones that matter.
 */
function PeoplePanel({
  title,
  hint,
  icon: Icon,
  people,
  detail,
}: {
  title: string;
  hint: string;
  icon: typeof Mail;
  people: RosterRow[];
  detail: (row: RosterRow) => string;
}) {
  if (people.length === 0) return null;

  const emails = people
    .map((r) => r.email)
    .filter(Boolean)
    .join(", ");

  return (
    <Panel
      title={`${people.length} · ${title}`}
      hint={hint}
      action={
        emails ? (
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(emails)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium shrink-0"
            style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
            title="Copy every email address in this list"
          >
            <Mail className="w-3 h-3" />
            Copy emails
          </button>
        ) : undefined
      }
    >
      <ul className="space-y-2">
        {people.map((r, i) => (
          <li key={r.notion_page_id ?? r.user_id ?? i} className="flex items-start gap-3">
            <Icon
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              style={{ color: "var(--status-paused)" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[12.5px] font-medium" style={{ color: "var(--foreground)" }}>
                  {rosterName(r)}
                </span>
                {r.track && (
                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    {r.track}
                  </span>
                )}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                {[r.email, detail(r)].filter(Boolean).join(" — ")}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
