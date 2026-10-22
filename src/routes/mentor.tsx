import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarCheck, CheckCircle2, ClipboardList, MessageCircle, Users } from "lucide-react";
import { DashboardShell, DashboardSpinner, TabBar } from "@/components/dashboard/DashboardShell";
import { useStaffDashboard } from "@/components/dashboard/useStaffDashboard";
import { ParticipantsView } from "@/components/dashboard/views/ParticipantsView";
import { DailyUpdatesView } from "@/components/dashboard/views/DailyUpdatesView";
import { AssignmentsView } from "@/components/dashboard/views/AssignmentsView";
import { ReflectionsView } from "@/components/dashboard/views/ReflectionsView";
import { AttendanceView } from "@/components/dashboard/views/AttendanceView";

export const Route = createFileRoute("/mentor")({
  component: MentorDashboard,
});

type View = "participants" | "attendance" | "daily-updates" | "assignments" | "reflections";

const TABS = [
  { value: "participants" as const, label: "Participants", icon: Users },
  { value: "attendance" as const, label: "Attendance", icon: CalendarCheck },
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

  // Graduates (per Notion) drop out of the people a mentor works with day to
  // day, but stay in the history tabs, where their past work still belongs.
  const inProgress = staff.participants.filter((p) => !staff.graduatedIds.has(p.user_id));
  const graduated = staff.participants.filter((p) => staff.graduatedIds.has(p.user_id));

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
            participants={inProgress}
            graduatedParticipants={graduated}
            cohortMemberMap={staff.cohortMemberMap}
            todayUpdateUserIds={staff.todayUpdateUserIds}
            invites={staff.invites}
            removedParticipants={staff.removedParticipants}
            onAccessChanged={staff.refreshAccess}
          />
        )}

        {view === "attendance" && (
          <AttendanceView
            participants={inProgress}
            cohortMemberMap={staff.cohortMemberMap}
            currentUserId={staff.user?.id}
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
