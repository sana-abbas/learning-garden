import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Award, PhoneCall, Users } from "lucide-react";

export type MilestoneVariant = "fc1" | "fc2" | "fc3" | "fc4";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  variant: MilestoneVariant;
}

const COPY: Record<MilestoneVariant, {
  title: string;
  body: string;
  cta: string;
  badge: string;
  isHarvest?: boolean;
}> = {
  fc1: {
    badge: "Founders' Call · Month 3",
    title: "Foundations Roundtable unlocked! 🌱",
    body: "You've planted deep roots through Internet, JavaScript, and HTML & CSS. Hop on the Foundations Roundtable to meet the founders and your cohort.",
    cta: "Claim my Foundations Call",
  },
  fc2: {
    badge: "Founders' Call · Month 6",
    title: "Mid-Way Resilience Roundtable! 🌿",
    body: "Portfolio shipped, dynamic websites and TypeScript in the bag. Time for the Resilience Roundtable — momentum, mindset, and what's ahead.",
    cta: "Claim my Resilience spot",
  },
  fc3: {
    badge: "Founders' Call · Month 9",
    title: "Full-Stack Momentum Call! 🌸",
    body: "Databases and React complete — your stem is reaching the sky. Join the Momentum Call to plan your final project and career runway.",
    cta: "Claim my Momentum Call",
  },
  fc4: {
    badge: "Founders' Call · Month 12",
    title: "The Secret Garden is open! 🌸",
    body: "You landed your first paid project! You've earned the Master Gardener Badge and unlocked the 'Career Harvest' Founders' Call!",
    cta: "Claim my Career Harvest Call",
    isHarvest: true,
  },
};

export function MilestoneModal({ open, onOpenChange, variant }: Props) {
  const fired = useRef(false);
  const copy = COPY[variant];
  const isHarvest = !!copy.isHarvest;

  useEffect(() => {
    if (open && isHarvest && !fired.current) {
      fired.current = true;
      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          origin: { y: 0.6 },
          particleCount: Math.floor(220 * particleRatio),
          colors: ["#f4a8c8", "#c084fc", "#fde68a", "#86efac", "#fb923c"],
          ...opts,
        });
      };
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
    if (!open) fired.current = false;
  }, [open, isHarvest]);

  const Icon = isHarvest ? Award : variant === "fc3" ? Sparkles : variant === "fc2" ? Users : PhoneCall;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 p-0 overflow-hidden bg-transparent shadow-none">
        <div
          className="relative rounded-3xl p-8 text-center"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.97 0.04 90) 0%, oklch(0.93 0.06 130) 100%)",
            boxShadow: "var(--shadow-bloom)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center animate-float-soft"
            style={{
              background: isHarvest
                ? "radial-gradient(circle at 35% 35%, var(--bloom-exotic), var(--bloom-magenta))"
                : "radial-gradient(circle at 35% 35%, var(--leaf-light), var(--primary))",
              boxShadow: isHarvest
                ? "0 0 60px oklch(0.7 0.22 50 / 0.6)"
                : "0 0 50px oklch(0.6 0.16 145 / 0.5)",
            }}
          >
            <Icon className="w-9 h-9 text-white drop-shadow" strokeWidth={1.8} />
          </div>

          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)] mb-2">
            {copy.badge}
          </p>

          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-serif tracking-tight text-[color:var(--foreground)]">
              {copy.title}
            </DialogTitle>
            <DialogDescription className="text-[color:var(--muted-foreground)] text-base leading-relaxed">
              {copy.body}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-7 flex-col">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-12 text-base font-medium rounded-full border-0"
              style={{
                background: isHarvest
                  ? "linear-gradient(135deg, var(--bloom-magenta), var(--bloom-purple))"
                  : "linear-gradient(135deg, var(--primary), var(--leaf))",
                color: "white",
                boxShadow: "0 10px 30px -8px oklch(0.5 0.18 340 / 0.5)",
              }}
            >
              {copy.cta}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
