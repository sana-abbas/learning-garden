import { useState } from "react";
import { Leaf, Sprout, Globe, Code2, Layers, GitBranch, LayoutTemplate, FileType2, Database, Atom, Server, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OnboardingOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

// All starting-point options (modules + paid projects, no calls)
export const ONBOARDING_OPTIONS: OnboardingOption[] = [
  { id: "ch1",   title: "How the Internet Works",     subtitle: "HTTP, browsers, the web",        icon: Globe         },
  { id: "ch2",   title: "Interactivity & UX",         subtitle: "JavaScript fundamentals",         icon: Code2         },
  { id: "ch3",   title: "HTML & CSS",                 subtitle: "Structure & styling",             icon: Layers        },
  { id: "ch4",   title: "Version Control & Hosting",  subtitle: "Git, GitHub, deploys",            icon: GitBranch     },
  { id: "paid1", title: "Paid Project: Portfolio",    subtitle: "Interactive portfolio build",     icon: Briefcase     },
  { id: "ch5",   title: "Dynamic Websites",           subtitle: "Responsive & frameworks",         icon: LayoutTemplate},
  { id: "ch6",   title: "TypeScript",                 subtitle: "Typed JavaScript",                icon: FileType2     },
  { id: "ch7",   title: "Databases",                  subtitle: "Design, query, manage",           icon: Database      },
  { id: "ch8",   title: "React",                      subtitle: "Components & state",              icon: Atom          },
  { id: "ch9",   title: "Node.js",                    subtitle: "Server-side JavaScript",          icon: Server        },
  { id: "paid2", title: "Paid Project: Full-Stack",   subtitle: "Capstone build",                  icon: Briefcase     },
];

interface Props {
  userName: string;
  onConfirm: (startingStepId: string) => void;
}

export function OnboardingScreen({ userName, onConfirm }: Props) {
  const [selected, setSelected] = useState<string>("ch1");

  const firstName = userName.split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color:var(--background)]/80 backdrop-blur-md">
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, oklch(0.97 0.04 90) 0%, oklch(0.93 0.06 130) 100%)",
          boxShadow: "var(--shadow-bloom)",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5 shrink-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
              boxShadow: "0 0 40px oklch(0.6 0.16 145 / 0.4)",
            }}
          >
            <Leaf className="w-7 h-7 text-white" strokeWidth={2} />
          </div>

          <h1 className="font-serif text-2xl tracking-tight text-[color:var(--foreground)] mb-1">
            Welcome, {firstName}! 🌱
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)] leading-relaxed">
            You're joining an existing cohort. Tell us which chapter you're currently on and we'll pick up right there — everything before it will be marked complete.
          </p>
        </div>

        {/* Scrollable chapter list */}
        <div className="flex-1 overflow-y-auto px-8 pb-2 space-y-2">
          {ONBOARDING_OPTIONS.map((opt, idx) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            const isFirst = idx === 0;

            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-[color:var(--sidebar-accent)] border border-[color:var(--primary)]/40 shadow-sm"
                    : "border border-transparent hover:bg-[oklch(0.92_0.025_85)] hover:border-[color:var(--sidebar-border)]"
                }`}
              >
                <input
                  type="radio"
                  name="starting-chapter"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => setSelected(opt.id)}
                  className="sr-only"
                />

                {/* Custom radio circle */}
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]"
                      : "border-[color:var(--muted-foreground)]/40"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, var(--primary), var(--leaf-light))"
                      : "oklch(0.9 0.03 85)",
                    color: isSelected ? "white" : "var(--muted-foreground)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isSelected ? "text-[color:var(--foreground)]" : "text-[color:var(--sidebar-foreground)]"}`}>
                      {opt.title}
                    </span>
                    {isFirst && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[color:var(--primary)]/15 text-[color:var(--primary)] shrink-0">
                        Start
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5">
                    {opt.subtitle}
                  </div>
                </div>

                {/* Sprout icon for selected */}
                {isSelected && (
                  <Sprout className="w-4 h-4 text-[color:var(--primary)] shrink-0" />
                )}
              </label>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="px-8 py-6 shrink-0 border-t border-[color:var(--border)]/50">
          <p className="text-[11px] text-[color:var(--muted-foreground)] text-center mb-4">
            {selected === "ch1"
              ? "You'll start fresh from the very beginning. 🌱"
              : `Everything before ${ONBOARDING_OPTIONS.find(o => o.id === selected)?.title} will be marked complete.`}
          </p>
          <Button
            onClick={() => onConfirm(selected)}
            className="w-full h-12 text-base font-medium rounded-full border-0"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--leaf))",
              color: "white",
              boxShadow: "0 10px 30px -8px oklch(0.5 0.18 145 / 0.5)",
            }}
          >
            Start my garden 🌸
          </Button>
        </div>
      </div>
    </div>
  );
}
