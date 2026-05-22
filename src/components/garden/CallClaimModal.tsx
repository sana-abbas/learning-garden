import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneCall, Sparkles, Users, Award, CheckCircle2 } from "lucide-react";
import type { MilestoneVariant } from "@/components/garden/MilestoneModal";

interface Props {
  open: boolean;
  variant: MilestoneVariant;
  onClaim: () => void;
  onClose: () => void;
}

const COPY: Record<MilestoneVariant, {
  badge: string;
  title: string;
  body: string;
  cta: string;
  successTitle: string;
  successBody: string;
  isHarvest?: boolean;
}> = {
  fc1: {
    badge: "Founders' Call · Month 3",
    title: "Foundations Roundtable 🌱",
    body: "You've planted deep roots through Internet, JavaScript, and HTML & CSS. Claim your spot on the Foundations Roundtable — your mentor and the founders will reach out with all the details.",
    cta: "Claim my Foundations Call",
    successTitle: "You're on the list! 🌿",
    successBody: "Your claim has been received. Your mentor will be in touch soon with the call details.",
  },
  fc2: {
    badge: "Founders' Call · Month 6",
    title: "Resilience Roundtable 🌿",
    body: "Portfolio shipped, dynamic websites and TypeScript in the bag. Claim your spot on the Resilience Roundtable — momentum, mindset, and what's ahead.",
    cta: "Claim my Resilience spot",
    successTitle: "Claimed! 🌸",
    successBody: "Your mentor has been notified and will be in touch with the call details.",
  },
  fc3: {
    badge: "Founders' Call · Month 9",
    title: "Full-Stack Momentum Call 🌸",
    body: "Databases and React complete. Claim your Momentum Call spot to plan your final project and career runway.",
    cta: "Claim my Momentum Call",
    successTitle: "We'll be in touch! ✨",
    successBody: "Your claim is in. Expect a message from your mentor with everything you need.",
  },
  fc4: {
    badge: "Founders' Call · Month 12",
    title: "Career Harvest Call 🏆",
    body: "You've earned the Master Gardener Badge. Claim your Career Harvest Call — the final milestone before you launch your dev career.",
    cta: "Claim my Career Harvest Call",
    successTitle: "Incredible achievement! 🌸",
    successBody: "Your claim is in. Your mentor will reach out soon. You've come a long way.",
    isHarvest: true,
  },
};

export function CallClaimModal({ open, variant, onClaim, onClose }: Props) {
  const [claimed, setClaimed] = useState(false);
  const fired = useRef(false);
  const copy = COPY[variant];
  const isHarvest = !!copy.isHarvest;

  // Reset state when modal opens for a new variant
  useEffect(() => {
    if (open) {
      setClaimed(false);
      fired.current = false;
    }
  }, [open, variant]);

  // Confetti on claim
  useEffect(() => {
    if (claimed && !fired.current) {
      fired.current = true;
      if (isHarvest) {
        const fire = (ratio: number, opts: confetti.Options) =>
          confetti({ origin: { y: 0.6 }, particleCount: Math.floor(200 * ratio), colors: ["#f4a8c8", "#c084fc", "#fde68a", "#86efac", "#fb923c"], ...opts });
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      } else {
        confetti({ particleCount: 70, spread: 55, origin: { y: 0.5 }, colors: ["#4ade80", "#86efac", "#f472b6", "#a78bfa"] });
      }
    }
  }, [claimed, isHarvest]);

  const handleClaim = () => {
    setClaimed(true);
    onClaim(); // check the item + trigger email in parent
  };

  const handleClose = () => {
    setClaimed(false);
    onClose();
  };

  const Icon = isHarvest ? Award : variant === "fc3" ? Sparkles : variant === "fc2" ? Users : PhoneCall;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md border-0 p-0 overflow-hidden bg-transparent shadow-none">
        <div
          className="relative rounded-3xl p-8 text-center"
          style={{
            background: "linear-gradient(160deg, oklch(0.97 0.04 90) 0%, oklch(0.93 0.06 130) 100%)",
            boxShadow: "var(--shadow-bloom)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Icon */}
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
            {claimed
              ? <CheckCircle2 className="w-9 h-9 text-white drop-shadow" strokeWidth={1.8} />
              : <Icon className="w-9 h-9 text-white drop-shadow" strokeWidth={1.8} />
            }
          </div>

          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)] mb-2">
            {copy.badge}
          </p>

          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-serif tracking-tight text-[color:var(--foreground)]">
              {claimed ? copy.successTitle : copy.title}
            </DialogTitle>
            <DialogDescription className="text-[color:var(--muted-foreground)] text-base leading-relaxed">
              {claimed ? copy.successBody : copy.body}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-7 flex gap-3">
            {claimed ? (
              <Button
                onClick={handleClose}
                className="w-full h-12 text-base font-medium rounded-full border-0"
                style={{
                  background: isHarvest
                    ? "linear-gradient(135deg, var(--bloom-magenta), var(--bloom-purple))"
                    : "linear-gradient(135deg, var(--primary), var(--leaf))",
                  color: "white",
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1 rounded-full text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                >
                  Not yet
                </Button>
                <Button
                  onClick={handleClaim}
                  className="flex-1 h-12 text-base font-medium rounded-full border-0"
                  style={{
                    background: isHarvest
                      ? "linear-gradient(135deg, var(--bloom-magenta), var(--bloom-purple))"
                      : "linear-gradient(135deg, var(--primary), var(--leaf))",
                    color: "white",
                  }}
                >
                  {copy.cta}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
