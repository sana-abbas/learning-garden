import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Leaf,
  Code2,
  Layers,
  Briefcase,
  Sprout,
  Trophy,
  Globe,
  GitBranch,
  LayoutTemplate,
  FileType2,
  Database,
  Atom,
  Server,
  PhoneCall,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { BotanicalGarden } from "@/components/garden/BotanicalGarden";
import { MilestoneModal, type MilestoneVariant } from "@/components/garden/MilestoneModal";

import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

type StepKind = "module" | "paid" | "call";

interface SubTask {
  id: string;
  label: string;
}

interface Step {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: StepKind;
  callVariant?: MilestoneVariant;
  subtasks?: SubTask[];
}

const STEPS: Step[] = [
  {
    id: "ch1",
    title: "How the Internet Works",
    subtitle: "HTTP, browsers, the web",
    duration: "1 week",
    icon: Globe,
    kind: "module",
    subtasks: [
      { id: "ch1-a", label: "Read: What is the internet?" },
      { id: "ch1-b", label: "Read: How does the internet work?" },
      { id: "ch1-c", label: "Read: Internet Routing Hierarchy" },
      { id: "ch1-d", label: "Assignment: Publish blog post on Medium" },
    ],
  },
  {
    id: "ch2",
    title: "Interactivity & UX",
    subtitle: "JavaScript fundamentals",
    duration: "7 weeks",
    icon: Code2,
    kind: "module",
    subtasks: [
      { id: "ch2-a", label: "Intro to JavaScript" },
      { id: "ch2-b", label: "Variables, data types & operators" },
      { id: "ch2-c", label: "Functions & control structures" },
      { id: "ch2-d", label: "Manipulating HTML with JS (DOM)" },
      { id: "ch2-e", label: "Handling user events" },
      { id: "ch2-f", label: "Form validation & interactivity" },
    ],
  },
  {
    id: "ch3",
    title: "HTML & CSS",
    subtitle: "Structure & styling",
    duration: "3 weeks",
    icon: Layers,
    kind: "module",
    subtasks: [
      { id: "ch3-a", label: "Learn HTML — beginner course" },
      { id: "ch3-b", label: "HTML basics (Codecademy)" },
      { id: "ch3-c", label: "Learn CSS in 11 hours" },
      { id: "ch3-d", label: "CSS basic & advanced properties" },
      { id: "ch3-e", label: "Assignment: Build personal portfolio" },
    ],
  },
  {
    id: "fc1",
    title: "Foundations Roundtable",
    subtitle: "Founders' Call · Month 3",
    duration: "Live call",
    icon: PhoneCall,
    kind: "call",
    callVariant: "fc1",
  },
  {
    id: "ch4",
    title: "Version Control & Hosting",
    subtitle: "Git, GitHub, deploys",
    duration: "1 week",
    icon: GitBranch,
    kind: "module",
    subtasks: [
      { id: "ch4-a", label: "What is version control? Install Git" },
      { id: "ch4-b", label: "Learn Git, GitHub & GitHub Desktop" },
      { id: "ch4-c", label: "Deploy with GitHub Pages or Netlify" },
    ],
  },
  {
    id: "paid1",
    title: "Paid Project: Portfolio",
    subtitle: "Interactive portfolio build",
    duration: "4 weeks",
    icon: Briefcase,
    kind: "paid",
    subtasks: [
      { id: "paid1-a", label: "Plan & wireframe interactive portfolio" },
      { id: "paid1-b", label: "Set up dev environment & Git repo" },
      { id: "paid1-c", label: "Implement 3+ JavaScript features" },
      { id: "paid1-d", label: "Deploy to Netlify / GitHub Pages" },
      { id: "paid1-e", label: "Submit repo, live demo & video walkthrough" },
    ],
  },
  { id: "ch5", title: "Dynamic Websites", subtitle: "Responsive & frameworks", duration: "2 weeks", icon: LayoutTemplate, kind: "module" },
  { id: "ch6", title: "TypeScript", subtitle: "Typed JavaScript", duration: "2 weeks", icon: FileType2, kind: "module" },
  { id: "fc2", title: "Resilience Roundtable", subtitle: "Founders' Call · Month 6", duration: "Live call", icon: PhoneCall, kind: "call", callVariant: "fc2" },
  { id: "ch7", title: "Databases", subtitle: "Design, query, manage", duration: "4 weeks", icon: Database, kind: "module" },
  { id: "ch8", title: "React", subtitle: "Components & state", duration: "6 weeks", icon: Atom, kind: "module" },
  { id: "fc3", title: "Full-Stack Momentum Call", subtitle: "Founders' Call · Month 9", duration: "Live call", icon: PhoneCall, kind: "call", callVariant: "fc3" },
  { id: "ch9", title: "Node.js", subtitle: "Server-side JavaScript", duration: "6 weeks", icon: Server, kind: "module" },
  { id: "paid2", title: "Paid Project: Full-Stack App", subtitle: "Capstone build", duration: "2–3 months", icon: Briefcase, kind: "paid" },
  { id: "fc4", title: "Career Harvest Call", subtitle: "Founders' Call · Month 12", duration: "Master Gardener", icon: Sprout, kind: "call", callVariant: "fc4" },
];

function Index() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // checked map for steps without subtasks AND for sub-tasks
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<MilestoneVariant | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  // A step is "complete" if it has no subtasks and is checked, OR all subtasks are checked
  const isStepComplete = (step: Step): boolean => {
    if (step.subtasks && step.subtasks.length > 0) {
      return step.subtasks.every((s) => checked[s.id]);
    }
    return !!checked[step.id];
  };

  const completion = useMemo(() => {
    const map: Record<string, boolean> = {};
    STEPS.forEach((s) => (map[s.id] = isStepComplete(s)));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const toggleStep = (step: Step) => {
    if (step.subtasks && step.subtasks.length > 0) {
      const allDone = step.subtasks.every((s) => checked[s.id]);
      setChecked((prev) => {
        const next = { ...prev };
        step.subtasks!.forEach((s) => (next[s.id] = !allDone));
        return next;
      });
      return;
    }
    setChecked((prev) => {
      const wasChecked = !!prev[step.id];
      const next = { ...prev, [step.id]: !wasChecked };
      if (!wasChecked && step.kind === "call" && step.callVariant) {
        const variant = step.callVariant;
        setTimeout(() => setModal(variant), 600);
      }
      return next;
    });
  };

  const toggleSubtask = (step: Step, subId: string) => {
    setChecked((prev) => {
      const next = { ...prev, [subId]: !prev[subId] };
      // if parent had call variant we don't trigger here (calls have no subtasks)
      return next;
    });
  };

  const completedCount = STEPS.filter((s) => completion[s.id]).length;
  const progress = (completedCount / STEPS.length) * 100;
  const allDone = completedCount === STEPS.length;

  const rootsActive = completion["ch1"] || completion["ch2"];
  const sproutActive = completion["ch2"] && completion["ch3"];
  const stemActive = completion["ch4"] && completion["paid1"];
  const flowerActive =
    completion["ch5"] && completion["ch6"] && completion["ch7"] && completion["ch8"];
  const exoticActive = completion["ch9"] && completion["paid2"];

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-[420px] lg:min-h-screen lg:max-h-screen lg:overflow-y-auto bg-[color:var(--sidebar)] border-r border-[color:var(--sidebar-border)] flex flex-col">
        <div className="p-7 border-b border-[color:var(--sidebar-border)] sticky top-0 bg-[color:var(--sidebar)] z-10">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
                  boxShadow: "var(--shadow-leaf)",
                }}
              >
                <Leaf className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="font-serif text-xl tracking-tight text-[color:var(--sidebar-foreground)]">
                  Code Blossom
                </h1>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Full-Stack Curriculum
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={userEmail ?? "Sign out"}
              className="p-2 rounded-lg text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--background)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {userEmail && (
            <p className="mt-3 text-[11px] text-[color:var(--muted-foreground)] truncate">
              Signed in as <span className="font-medium">{userEmail}</span>
            </p>
          )}

          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Curriculum
              </span>
              <span className="text-xs font-mono text-[color:var(--muted-foreground)]">
                {completedCount}/{STEPS.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[oklch(0.88_0.04_85)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-1.5">
          {STEPS.map((step, i) => {
            const isChecked = completion[step.id];
            const Icon = step.icon;
            const isCall = step.kind === "call";
            const isPaid = step.kind === "paid";
            const hasSubs = !!(step.subtasks && step.subtasks.length);
            const isOpen = openId === step.id;
            const subDone = hasSubs
              ? step.subtasks!.filter((s) => checked[s.id]).length
              : 0;

            return (
              <div
                key={step.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isChecked
                    ? isCall
                      ? "bg-[color:var(--sidebar-accent)] border-[color:var(--bloom-pink)]/40 shadow-sm"
                      : "bg-[color:var(--sidebar-accent)] border-[color:var(--primary)]/30 shadow-sm"
                    : isCall
                      ? "border-dashed border-[color:var(--bloom-pink)]/30 bg-[oklch(0.97_0.025_340)]/40"
                      : "border-transparent hover:bg-[oklch(0.92_0.025_85)] hover:border-[color:var(--sidebar-border)]"
                }`}
              >
                <div className="group flex items-center gap-3.5 p-3.5">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleStep(step)}
                    className="w-5 h-5 rounded-md border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
                  />
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isChecked ? "scale-105" : "opacity-70"
                    }`}
                    style={{
                      background: isChecked
                        ? isCall
                          ? "linear-gradient(135deg, var(--bloom-pink), var(--bloom-magenta))"
                          : isPaid
                            ? "linear-gradient(135deg, var(--bloom-pink), var(--primary))"
                            : "linear-gradient(135deg, var(--primary), var(--leaf-light))"
                        : isCall
                          ? "oklch(0.94 0.04 340)"
                          : "oklch(0.9 0.03 85)",
                      color: isChecked
                        ? "white"
                        : isCall
                          ? "var(--bloom-magenta)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => hasSubs && setOpenId(isOpen ? null : step.id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-medium truncate transition-colors ${
                          isChecked
                            ? "text-[color:var(--foreground)]"
                            : "text-[color:var(--sidebar-foreground)]"
                        }`}
                      >
                        {step.title}
                      </div>
                      {isCall && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[color:var(--bloom-pink)]/15 text-[color:var(--bloom-magenta)] shrink-0">
                          Call
                        </span>
                      )}
                      {isPaid && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[color:var(--primary)]/15 text-[color:var(--primary)] shrink-0">
                          Paid
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5 truncate">
                      {isCall
                        ? step.subtitle
                        : `${step.subtitle} · ${step.duration}${
                            hasSubs ? ` · ${subDone}/${step.subtasks!.length}` : ""
                          }`}
                    </div>
                  </button>
                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : step.id)}
                      className="p-1 rounded-md hover:bg-[oklch(0.92_0.025_85)] cursor-pointer shrink-0"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-[color:var(--muted-foreground)] transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : (
                    !isCall && (
                      <span className="text-[10px] font-mono text-[color:var(--muted-foreground)]/70 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )
                  )}
                </div>

                {hasSubs && isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-[color:var(--sidebar-border)]/60 mt-1">
                    <ul className="space-y-1.5 pt-3">
                      {step.subtasks!.map((sub) => {
                        const subChecked = !!checked[sub.id];
                        return (
                          <li key={sub.id}>
                            <label className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-[oklch(0.94_0.02_85)] transition-colors">
                              <Checkbox
                                checked={subChecked}
                                onCheckedChange={() => toggleSubtask(step, sub.id)}
                                className="w-4 h-4 mt-0.5 rounded border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
                              />
                              <span
                                className={`text-[12.5px] leading-snug transition-all ${
                                  subChecked
                                    ? "text-[color:var(--muted-foreground)] line-through decoration-[color:var(--primary)]/50"
                                    : "text-[color:var(--sidebar-foreground)]"
                                }`}
                              >
                                {sub.label}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="pt-2">
                      <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1.5 font-medium">
                        <MessageCircle className="w-3 h-3" />
                        How did this chapter feel?
                      </label>
                      <textarea
                        value={notes[step.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [step.id]: e.target.value }))
                        }
                        placeholder="Jot a reflection, an aha moment, or a question…"
                        rows={2}
                        className="w-full text-[12px] leading-relaxed p-2.5 rounded-lg bg-[oklch(0.97_0.015_85)] border border-[color:var(--sidebar-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 focus:border-[color:var(--primary)]/40 resize-none placeholder:text-[color:var(--muted-foreground)]/60 text-[color:var(--sidebar-foreground)] transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t border-[color:var(--sidebar-border)] sticky bottom-0 bg-[color:var(--sidebar)]">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: allDone
                ? "linear-gradient(135deg, var(--bloom-pink), var(--bloom-purple))"
                : "oklch(0.92 0.03 85)",
              color: allDone ? "white" : "var(--muted-foreground)",
            }}
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <div className="text-xs leading-snug">
              {allDone
                ? "Master Gardener Badge earned 🌸"
                : "Complete all modules & calls to earn the Master Gardener Badge."}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-5 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)] mb-2">
                Your Botanical Garden
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-[color:var(--foreground)]">
                Tend your learning. Watch it bloom.
              </h2>
            </div>
            <div className="text-sm text-[color:var(--muted-foreground)] italic max-w-xs text-right">
              {!rootsActive && "An empty plot, full of promise."}
              {rootsActive && !sproutActive && "Roots, quiet and luminous, take hold."}
              {sproutActive && !stemActive && "A sprout greets the morning sun."}
              {stemActive && !flowerActive && "Leaves unfurl toward the sky."}
              {flowerActive && !exoticActive && "First bloom — vivid and whole."}
              {exoticActive && "A secret garden, fully alive."}
            </div>
          </div>

          <BotanicalGarden
            rootsActive={rootsActive}
            sproutActive={sproutActive}
            stemActive={stemActive}
            flowerActive={flowerActive}
            exoticActive={exoticActive}
          />
        </div>
      </main>

      <MilestoneModal
        open={modal !== null}
        onOpenChange={(o) => !o && setModal(null)}
        variant={modal ?? "fc1"}
      />
    </div>
  );
}
