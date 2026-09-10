import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { DashboardShell, DashboardSpinner, TabBar } from "@/components/dashboard/DashboardShell";
import { useStaffDashboard } from "@/components/dashboard/useStaffDashboard";
import { useFounderRoster } from "@/components/dashboard/useFounderRoster";
import { timeAgo } from "@/components/dashboard/format";
import { attentionLists } from "@/components/dashboard/metrics";
import { OverviewView } from "@/components/dashboard/views/OverviewView";
import { RosterView } from "@/components/dashboard/views/RosterView";
import { AttentionView } from "@/components/dashboard/views/AttentionView";
import { DailyUpdatesView } from "@/components/dashboard/views/DailyUpdatesView";
import { AssignmentsView } from "@/components/dashboard/views/AssignmentsView";
import { ReflectionsView } from "@/components/dashboard/views/ReflectionsView";

export const Route = createFileRoute("/founder")({
  component: FounderDashboard,
});

type View =
  | "overview"
  | "participants"
  | "attention"
  | "daily-updates"
  | "assignments"
  | "reflections";

const TABS = [
  { value: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { value: "participants" as const, label: "Participants", icon: Users },
  { value: "attention" as const, label: "Attention", icon: AlertTriangle },
  { value: "daily-updates" as const, label: "Daily Updates", icon: ClipboardList },
  { value: "assignments" as const, label: "Assignments", icon: CheckCircle2 },
  { value: "reflections" as const, label: "Reflections", icon: MessageCircle },
];

function FounderDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("overview");

  const staff = useStaffDashboard("founder");
  const roster = useFounderRoster(staff.isFounder);

  // Daily updates are loaded when that tab is opened, not on mount. Overview's
  // engagement figures come from founder_roster() rather than these rows, so
  // pulling every update up front would fetch thousands of rows nobody reads.
  if (staff.loading) return <DashboardSpinner />;

  const needsAttention = roster.rows.length > 0 ? countAttention(roster) : 0;

  return (
    <DashboardShell
      subtitle="Founder Dashboard"
      onSignOut={staff.signOut}
      actions={
        <>
          <SyncStatus roster={roster} />
          {staff.isMentor && (
            <button
              type="button"
              onClick={() => navigate({ to: "/mentor" })}
              className="px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
              style={{
                border: "1px solid var(--sidebar-border)",
                color: "var(--muted-foreground)",
              }}
            >
              Mentor view
            </button>
          )}
        </>
      }
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <TabBar
          tabs={TABS.map((t) =>
            t.value === "attention" && needsAttention > 0
              ? { ...t, label: `Attention (${needsAttention})` }
              : t,
          )}
          active={view}
          onChange={(next) => {
            setView(next);
            if (next === "daily-updates") void staff.fetchDailyUpdates();
          }}
        />

        {roster.error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "var(--sidebar)",
              border: "1px solid var(--destructive)",
              color: "var(--foreground)",
            }}
          >
            <strong>The roster could not be loaded.</strong>{" "}
            <span style={{ color: "var(--muted-foreground)" }}>
              {roster.error} — if this mentions <code>founder_roster</code>, the migration in{" "}
              <code>supabase/sql/2026-09-09-founder-dashboard.sql</code> has not been run yet.
            </span>
          </div>
        )}

        {roster.loading && !roster.error ? (
          <div className="flex justify-center py-20">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)" }}
            />
          </div>
        ) : (
          <>
            {view === "overview" && <OverviewView rows={roster.rows} />}

            {view === "participants" && <RosterView rows={roster.rows} />}

            {view === "attention" && <AttentionView rows={roster.rows} />}

            {view === "daily-updates" && (
              <DailyUpdatesView
                participants={staff.participants}
                cohortMemberMap={staff.cohortMemberMap}
                updates={staff.dailyUpdates}
                loading={staff.loadingUpdates}
              />
            )}

            {view === "assignments" && (
              <AssignmentsView
                participants={staff.participants}
                cohortMemberMap={staff.cohortMemberMap}
              />
            )}

            {view === "reflections" && (
              <ReflectionsView
                participants={staff.participants}
                cohortMemberMap={staff.cohortMemberMap}
              />
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

/** Total across every Attention list, for the tab badge. */
function countAttention(roster: ReturnType<typeof useFounderRoster>): number {
  const lists = attentionLists(roster.rows);
  return Object.values(lists).reduce((sum, list) => sum + list.length, 0);
}

/**
 * When the Notion roster was last mirrored, and a button to do it now.
 *
 * The staleness is shown rather than hidden: these numbers are a copy, and a
 * founder reading a graduation rate deserves to know whether it is from this
 * morning or from three weeks ago.
 */
function SyncStatus({ roster }: { roster: ReturnType<typeof useFounderRoster> }) {
  const { syncState, refreshing, refreshError, refresh } = roster;
  const failed = syncState?.last_status === "error";

  const label = refreshing
    ? "Syncing Notion…"
    : syncState?.last_synced_at
      ? `Notion synced ${timeAgo(syncState.last_synced_at).toLowerCase()}`
      : "Never synced";

  return (
    <div className="flex items-center gap-2">
      <div className="text-right hidden sm:block">
        <p
          className="text-[11px] leading-tight"
          style={{ color: failed ? "var(--destructive)" : "var(--muted-foreground)" }}
        >
          {failed ? "Last sync failed" : label}
        </p>
        {(failed || refreshError) && (
          <p
            className="text-[10px] leading-tight max-w-[220px] truncate"
            style={{ color: "var(--muted-foreground)" }}
            title={syncState?.last_error ?? refreshError ?? ""}
          >
            {syncState?.last_error ?? refreshError}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={refreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-opacity disabled:opacity-50"
        style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
        title="Re-read the participant roster from Notion"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );
}
