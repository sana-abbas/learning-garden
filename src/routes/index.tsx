import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Leaf, Code2, Layers, Palette, Briefcase, Sprout, Trophy } from "lucide-react";
import { BotanicalGarden } from "@/components/garden/BotanicalGarden";
import { MilestoneModal } from "@/components/garden/MilestoneModal";

export const Route = createFileRoute("/")({
  component: Index,
});

interface Step {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { id: "js-basics", title: "JavaScript Basics", subtitle: "Plant the seed", icon: Code2 },
  { id: "js-advanced", title: "JavaScript Advanced", subtitle: "Roots break ground", icon: Sprout },
  { id: "html", title: "HTML Framework", subtitle: "Stem reaches sky", icon: Layers },
  { id: "css", title: "CSS Styling", subtitle: "First bloom", icon: Palette },
  { id: "paid", title: "First Paid Project", subtitle: "Master Gardener", icon: Briefcase },
];

function Index() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<null | "midway" | "harvest">(null);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // Trigger modals only when transitioning to checked
      if (!prev[id] && next[id]) {
        if (id === "js-advanced") setTimeout(() => setModal("midway"), 700);
        if (id === "paid") setTimeout(() => setModal("harvest"), 600);
      }
      return next;
    });
  };

  const completed = Object.values(checked).filter(Boolean).length;
  const progress = (completed / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-[380px] lg:min-h-screen bg-[color:var(--sidebar)] border-r border-[color:var(--sidebar-border)] flex flex-col">
        <div className="p-7 border-b border-[color:var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
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
                Bootcamp
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
                  background:
                    "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-2">
          {STEPS.map((step, i) => {
            const isChecked = !!checked[step.id];
            const Icon = step.icon;
            return (
              <label
                key={step.id}
                className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  isChecked
                    ? "bg-[color:var(--sidebar-accent)] border-[color:var(--primary)]/30 shadow-sm"
                    : "border-transparent hover:bg-[oklch(0.92_0.025_85)] hover:border-[color:var(--sidebar-border)]"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(step.id)}
                  className="w-5 h-5 rounded-md border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
                />
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isChecked ? "scale-105" : "opacity-60 group-hover:opacity-100"
                  }`}
                  style={{
                    background: isChecked
                      ? "linear-gradient(135deg, var(--primary), var(--leaf-light))"
                      : "oklch(0.9 0.03 85)",
                    color: isChecked ? "white" : "var(--muted-foreground)",
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium transition-colors ${
                      isChecked
                        ? "text-[color:var(--foreground)]"
                        : "text-[color:var(--sidebar-foreground)]"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5">
                    Module {i + 1} · {step.subtitle}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="p-5 border-t border-[color:var(--sidebar-border)]">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background:
                completed === STEPS.length
                  ? "linear-gradient(135deg, var(--bloom-pink), var(--bloom-purple))"
                  : "oklch(0.92 0.03 85)",
              color:
                completed === STEPS.length ? "white" : "var(--muted-foreground)",
            }}
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <div className="text-xs leading-snug">
              {completed === STEPS.length
                ? "Master Gardener Badge earned 🌸"
                : "Complete all modules to earn the Master Gardener Badge."}
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
            <div className="text-sm text-[color:var(--muted-foreground)] italic">
              {completed === 0 && "An empty plot, full of promise."}
              {completed === 1 && "Roots, quiet and luminous, take hold."}
              {completed === 2 && "A sprout greets the morning sun."}
              {completed === 3 && "Leaves unfurl toward the sky."}
              {completed === 4 && "First bloom — vivid and whole."}
              {completed === 5 && "A secret garden, fully alive."}
            </div>
          </div>

          <BotanicalGarden
            rootsActive={!!checked["js-basics"]}
            sproutActive={!!checked["js-advanced"]}
            stemActive={!!checked["html"]}
            flowerActive={!!checked["css"]}
            exoticActive={!!checked["paid"]}
          />
        </div>
      </main>

      <MilestoneModal
        open={modal !== null}
        onOpenChange={(o) => !o && setModal(null)}
        variant={modal ?? "midway"}
      />
    </div>
  );
}
