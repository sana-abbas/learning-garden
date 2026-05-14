import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Award } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  variant: "midway" | "harvest";
}

export function MilestoneModal({ open, onOpenChange, variant }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (open && variant === "harvest" && !fired.current) {
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
  }, [open, variant]);

  const isHarvest = variant === "harvest";

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
          {/* Decorative orb */}
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
            {isHarvest ? (
              <Award className="w-10 h-10 text-white drop-shadow" strokeWidth={1.8} />
            ) : (
              <Sparkles className="w-9 h-9 text-white drop-shadow" strokeWidth={1.8} />
            )}
          </div>

          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-serif tracking-tight text-[color:var(--foreground)]">
              {isHarvest
                ? "The Secret Garden is open! 🌸"
                : "Deep Roots Established! 🌱"}
            </DialogTitle>
            <DialogDescription className="text-[color:var(--muted-foreground)] text-base leading-relaxed">
              {isHarvest
                ? "You landed your first paid project! You've earned the Master Gardener Badge and unlocked the 'Career Harvest' Founders' Call."
                : "You've unlocked the Mid-Way 'Resilience Roundtable' Founders' Call. Claim your spot!"}
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
              {isHarvest ? "Claim my Career Harvest Call" : "Claim my Roundtable spot"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
