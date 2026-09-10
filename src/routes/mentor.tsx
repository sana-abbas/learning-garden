import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, MessageCircle, Users } from "lucide-react";
import { DashboardShell, DashboardSpinner, TabBar } from "@/components/dashboard/DashboardShell";
import { useStaffDashboard } from "@/components/dashboard/useStaffDashboard";
import { ParticipantsView } from "@/components/dashboard/views/ParticipantsView";
import { DailyUpdatesView } from "@/components/dashboard/views/DailyUpdatesView";
import { AssignmentsView } from "@/components/dashboard/views/AssignmentsView";
import { ReflectionsView } from "@/components/dashboard/views/ReflectionsView";

export const Route = createFileRoute("/mentor")({
  component: MentorDashboard,
});

type View = "participants" | "daily-updates" | "assignments" | "reflections";

const TABS = [
  { value: "participants" as const, label: "Participants", icon: Users },
  { value: "daily-updates" as const, label: "Daily Updates", icon: ClipboardList },
  { value: "assignments" as const, label: "Assignments", icon: CheckCircle2 },
  { value: "reflections" as const, label: "Reflections", icon: MessageCircle },
];

/**
 * The mentor dashboard. Everything here lives in src/components/dashboard so
 * the founder dashboard shows the same views without a second implementation.
 */
function MentorDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("participants");
  const staff = useStaffDashboard("mentor");

  if (staff.loading) return <DashboardSpinner />;

  return (
    <DashboardShell
      subtitle="Mentor Dashboard"
      onSignOut={staff.signOut}
      actions={
        staff.isFounder ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/founder" })}
            className="px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
            style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
          >
            Founder view
          </button>
        ) : undefined
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <TabBar
          tabs={TABS}
          active={view}
          onChange={(next) => {
            setView(next);
            if (next === "daily-updates") void staff.fetchDailyUpdates();
          }}
        />

        {view === "participants" && (
          <ParticipantsView
            participants={staff.participants}
            cohortMemberMap={staff.cohortMemberMap}
            todayUpdateUserIds={staff.todayUpdateUserIds}
          />
        )}

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
      </div>
    </DashboardShell>
  );
}
