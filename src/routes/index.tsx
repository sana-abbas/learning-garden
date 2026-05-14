import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Leaf,
  Code2,
  Layers,
  Palette,
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
} from "lucide-react";
import { BotanicalGarden } from "@/components/garden/BotanicalGarden";
import { MilestoneModal, type MilestoneVariant } from "@/components/garden/MilestoneModal";

export const Route = createFileRoute("/")({
  component: Index,
});

type StepKind = "module" | "paid" | "call";

interface Step {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: StepKind;
  // for founders' calls only
  callVariant?: MilestoneVariant;
}

// Curriculum order with Founders' Calls inserted every ~3 months
const STEPS: Step[] = [
  { id: "ch1", title: "How the Internet Works", subtitle: "HTTP, browsers, the web", duration: "1 week", icon: Globe, kind: "module" },
  { id: "ch2", title: "Interactivity & UX", subtitle: "JavaScript fundamentals", duration: "7 weeks", icon: Code2, kind: "module" },
  { id: "ch3", title: "HTML & CSS", subtitle: "Structure & styling", duration: "3 weeks", icon: Layers, kind: "module" },
  { id: "fc1", title: "Foundations Roundtable", subtitle: "Founders' Call · Month 3", duration: "Live call", icon: PhoneCall, kind: "call", callVariant: "fc1" },
  { id: "ch4", title: "Version Control & Hosting", subtitle: "Git, GitHub, deploys", duration: "1 week", icon: GitBranch, kind: "module" },
  { id: "paid1", title: "Paid Project: Portfolio", subtitle: "Build & ship your site", duration: "4 weeks", icon: Briefcase, kind: "paid" },
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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<MilestoneVariant | null>(null);

  const toggle = (step: Step) => {
    setChecked((prev) => {
      const next = { ...prev, [step.id]: !prev[step.id] };
      if (!prev[step.id] && next[step.id] && step.kind === "call" && step.callVariant) {
        const variant = step.callVariant;
        setTimeout(() => setModal(variant), 600);
      }
      return next;
    });
  };

  const completed = Object.values(checked).filter(Boolean).length;
  const progress = (completed / STEPS.length) * 100;
  const allDone = completed === STEPS.length;

  // Garden stage mapping — derived from chapter completion
  const rootsActive = !!checked["ch1"] || !!checked["ch2"];
  const sproutActive = !!checked["ch2"] && !!checked["ch3"];
  const stemActive = !!checked["ch4"] && !!checked["paid1"];
  const flowerActive = !!checked["ch5"] && !!checked["ch6"] && !!checked["ch7"] && !!checked["ch8"];
  const exoticActive = !!checked["ch9"] && !!checked["paid2"];

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-[400px] lg:min-h-screen lg:max-h-screen lg:overflow-y-auto bg-[color:var(--sidebar)] border-r border-[color:var(--sidebar-border)] flex flex-col">
        <div className="p-7 border-b border-[color:var(--sidebar-border)] sticky top-0 bg-[color:var(--sidebar)] z-10">
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

          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Curriculum
              </span>
              <span className="text-xs font-mono text-[color:var(--muted-foreground)]">
                {completed}/{STEPS.length}
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
            const isChecked = !!checked[step.id];
            const Icon = step.icon;
            const isCall = step.kind === "call";
            const isPaid = step.kind === "paid";

            return (
              <label
                key={step.id}
                className={`group flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  isChecked
                    ? isCall
                      ? "bg-[color:var(--sidebar-accent)] border-[color:var(--bloom-pink)]/40 shadow-sm"
                      : "bg-[color:var(--sidebar-accent)] border-[color:var(--primary)]/30 shadow-sm"
                    : isCall
                      ? "border-dashed border-[color:var(--bloom-pink)]/30 bg-[oklch(0.97_0.025_340)]/40 hover:bg-[oklch(0.95_0.04_340)]/50"
                      : "border-transparent hover:bg-[oklch(0.92_0.025_85)] hover:border-[color:var(--sidebar-border)]"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(step)}
                  className="w-5 h-5 rounded-md border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
                />
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isChecked ? "scale-105" : "opacity-70 group-hover:opacity-100"
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
                <div className="flex-1 min-w-0">
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
                    {isCall ? step.subtitle : `${step.subtitle} · ${step.duration}`}
                  </div>
                </div>
                {!isCall && (
                  <span className="text-[10px] font-mono text-[color:var(--muted-foreground)]/70 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </label>
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
