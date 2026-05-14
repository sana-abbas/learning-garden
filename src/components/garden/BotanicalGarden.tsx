import { Sparkles } from "lucide-react";

interface Props {
  rootsActive: boolean;
  sproutActive: boolean;
  stemActive: boolean;
  flowerActive: boolean;
  exoticActive: boolean;
}

export function BotanicalGarden({
  rootsActive,
  sproutActive,
  stemActive,
  flowerActive,
  exoticActive,
}: Props) {
  return (
    <div className="relative w-full h-full min-h-[640px] rounded-[2rem] overflow-hidden shadow-[0_30px_80px_-30px_oklch(0.4_0.05_60/0.4)] border border-[color:var(--border)]">
      {/* Sky */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "linear-gradient(180deg, var(--sky-top) 0%, var(--sky-bottom) 100%)",
        }}
      >
        {/* Sun */}
        <div className="absolute top-10 right-12 w-32 h-32">
          <div
            className="absolute inset-0 rounded-full blur-2xl animate-sun-glow"
            style={{ background: "var(--sun-glow)" }}
          />
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 35%, oklch(0.99 0.05 95), var(--sun))",
              boxShadow: "0 0 60px var(--sun-glow)",
            }}
          />
        </div>
        {/* Soft clouds */}
        <div className="absolute top-20 left-10 w-40 h-12 rounded-full bg-white/40 blur-xl animate-float-soft" />
        <div
          className="absolute top-32 left-1/3 w-56 h-14 rounded-full bg-white/30 blur-xl animate-float-soft"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Soil */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(180deg, var(--soil-top) 0%, var(--soil-bottom) 100%)",
        }}
      >
        {/* Soil texture specks */}
        <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
          {Array.from({ length: 60 }).map((_, i) => (
            <circle
              key={i}
              cx={`${(i * 37) % 100}%`}
              cy={`${(i * 53) % 100}%`}
              r={Math.random() * 1.5 + 0.5}
              fill="oklch(0.5 0.06 55)"
            />
          ))}
        </svg>
      </div>

      {/* Horizon line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-[oklch(0.25_0.05_50)] -translate-y-px" />

      {/* The plant scene — central SVG */}
      <svg
        viewBox="0 0 800 800"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="rootGlow" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="var(--root-glow)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--root-glow)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="stemGrad" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.4 0.12 145)" />
            <stop offset="100%" stopColor="var(--stem)" />
          </linearGradient>
          <radialGradient id="petalPink" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(0.95 0.1 350)" />
            <stop offset="60%" stopColor="var(--bloom-pink)" />
            <stop offset="100%" stopColor="var(--bloom-magenta)" />
          </radialGradient>
          <radialGradient id="petalExotic" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(0.97 0.12 80)" />
            <stop offset="55%" stopColor="var(--bloom-exotic)" />
            <stop offset="100%" stopColor="var(--bloom-exotic-2)" />
          </radialGradient>
          <filter id="rootBlur">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* === ROOTS (below horizon y=400) === */}
        {rootsActive && (
          <g className={sproutActive ? "animate-pulse-glow" : ""}>
            {/* Glow halo */}
            <ellipse
              cx="400"
              cy="430"
              rx="240"
              ry="220"
              fill="url(#rootGlow)"
              filter="url(#rootBlur)"
            />
            {/* Root system — multiple branching paths drawn from top */}
            <g
              fill="none"
              stroke="var(--root-glow)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                filter: "drop-shadow(0 0 6px var(--root-glow))",
              }}
            >
              {[
                "M400 400 C 400 460, 360 500, 330 560 S 280 660, 250 740",
                "M400 400 C 400 460, 440 500, 470 560 S 520 660, 550 740",
                "M400 400 C 400 480, 380 540, 360 620",
                "M400 400 C 400 480, 420 540, 440 620",
                "M400 400 C 380 470, 320 510, 260 540 S 180 600, 140 680",
                "M400 400 C 420 470, 480 510, 540 540 S 620 600, 660 680",
                "M330 560 C 320 600, 290 620, 260 660",
                "M470 560 C 480 600, 510 620, 540 660",
                "M360 620 C 350 660, 320 690, 300 730",
                "M440 620 C 450 660, 480 690, 500 730",
                "M250 740 C 230 760, 220 770, 200 780",
                "M550 740 C 570 760, 580 770, 600 780",
              ].map((d, i) => (
                <path
                  key={i}
                  d={d}
                  strokeDasharray="900"
                  strokeDashoffset="900"
                  style={{
                    animation: `draw-path 1.6s ease-out ${i * 0.08}s forwards`,
                  }}
                />
              ))}
            </g>
            {/* Tiny root nodules / glowing dots */}
            {rootsActive &&
              [
                [330, 560],
                [470, 560],
                [260, 540],
                [540, 540],
                [360, 620],
                [440, 620],
                [200, 680],
                [600, 680],
              ].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill="oklch(0.95 0.18 180)"
                  style={{
                    filter: "drop-shadow(0 0 6px var(--root-glow))",
                    animation: `pulse-glow 2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
          </g>
        )}

        {/* === SPROUT (just above soil) === */}
        {sproutActive && !stemActive && (
          <g className="animate-grow-up" style={{ transformOrigin: "400px 400px" }}>
            <path
              d="M400 400 Q 398 380 400 360"
              stroke="var(--stem)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="388" cy="365" rx="14" ry="8" fill="var(--leaf-light)" transform="rotate(-30 388 365)" />
            <ellipse cx="412" cy="365" rx="14" ry="8" fill="var(--leaf-light)" transform="rotate(30 412 365)" />
          </g>
        )}

        {/* === STEM + LEAVES === */}
        {stemActive && (
          <g className="animate-grow-up" style={{ transformOrigin: "400px 400px" }}>
            {/* Main stem */}
            <path
              d="M400 400 C 395 320, 410 240, 400 160 S 395 90, 400 60"
              stroke="url(#stemGrad)"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
            {/* Leaves */}
            {[
              { cx: 360, cy: 320, rx: 50, ry: 22, rot: -30 },
              { cx: 440, cy: 270, rx: 55, ry: 24, rot: 30 },
              { cx: 350, cy: 220, rx: 48, ry: 20, rot: -25 },
              { cx: 450, cy: 170, rx: 52, ry: 22, rot: 28 },
              { cx: 360, cy: 130, rx: 42, ry: 18, rot: -22 },
            ].map((l, i) => (
              <g
                key={i}
                style={{
                  transformOrigin: `${l.cx}px ${l.cy}px`,
                  animation: `bloom-in 0.9s var(--ease-organic) ${0.4 + i * 0.15}s both`,
                }}
              >
                <ellipse
                  cx={l.cx}
                  cy={l.cy}
                  rx={l.rx}
                  ry={l.ry}
                  fill="var(--leaf)"
                  transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
                />
                <path
                  d={`M${l.cx - l.rx * 0.8} ${l.cy} Q ${l.cx} ${l.cy + (l.rot < 0 ? -2 : 2)} ${l.cx + l.rx * 0.8} ${l.cy}`}
                  stroke="oklch(0.4 0.1 145)"
                  strokeWidth="1"
                  fill="none"
                  transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
                  opacity="0.5"
                />
              </g>
            ))}
          </g>
        )}

        {/* === MAIN FLOWER === */}
        {flowerActive && (
          <g
            className="animate-bloom"
            style={{ transformOrigin: "400px 80px" }}
          >
            {/* Petals — 8 petals around center */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 360) / 8;
              return (
                <ellipse
                  key={i}
                  cx="400"
                  cy="40"
                  rx="28"
                  ry="48"
                  fill="url(#petalPink)"
                  transform={`rotate(${angle} 400 80)`}
                  style={{
                    filter: "drop-shadow(0 6px 12px oklch(0.6 0.2 340 / 0.4))",
                  }}
                />
              );
            })}
            {/* Inner petals */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 360) / 6 + 30;
              return (
                <ellipse
                  key={i}
                  cx="400"
                  cy="60"
                  rx="14"
                  ry="24"
                  fill="var(--bloom-purple)"
                  transform={`rotate(${angle} 400 80)`}
                  opacity="0.85"
                />
              );
            })}
            {/* Center */}
            <circle cx="400" cy="80" r="16" fill="oklch(0.85 0.18 75)" />
            <circle cx="400" cy="80" r="8" fill="oklch(0.6 0.2 50)" />
          </g>
        )}

        {/* === EXOTIC FLOWER === */}
        {exoticActive && (
          <g
            className="animate-bloom"
            style={{ transformOrigin: "560px 140px", animationDelay: "0.1s" }}
          >
            {/* Secondary stem */}
            <path
              d="M420 280 Q 500 220 555 150"
              stroke="var(--stem)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 360) / 10;
              return (
                <path
                  key={i}
                  d="M555 100 Q 545 120 555 145 Q 565 120 555 100"
                  fill="url(#petalExotic)"
                  transform={`rotate(${angle} 555 145)`}
                  style={{
                    filter: "drop-shadow(0 4px 10px oklch(0.7 0.22 50 / 0.5))",
                  }}
                />
              );
            })}
            <circle cx="555" cy="145" r="11" fill="oklch(0.95 0.2 90)" />
            <circle
              cx="555"
              cy="145"
              r="20"
              fill="none"
              stroke="oklch(0.95 0.18 95)"
              strokeWidth="1"
              opacity="0.6"
              className="animate-pulse-glow"
            />
          </g>
        )}
      </svg>

      {/* Sparkles overlay */}
      {exoticActive && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-[color:var(--sparkle)]"
              style={{
                top: `${Math.random() * 80 + 5}%`,
                left: `${Math.random() * 90 + 5}%`,
                width: `${Math.random() * 14 + 10}px`,
                height: `${Math.random() * 14 + 10}px`,
                opacity: 0,
                filter: "drop-shadow(0 0 8px var(--sparkle))",
                animation: `sparkle-twinkle ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {!rootsActive && (
        <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none">
          <div className="text-center px-6">
            <p className="text-[oklch(0.95_0.02_90)] text-lg font-medium tracking-wide drop-shadow-md">
              Your garden awaits.
            </p>
            <p className="text-[oklch(0.9_0.03_90)]/80 text-sm mt-1">
              Check off your first module to plant the seed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
