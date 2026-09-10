import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Leaf, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * The chrome both staff dashboards share: brand, garden previews, theme
 * toggle, sign out. `actions` is where each dashboard adds its own controls
 * (the Notion refresh, the link to the other dashboard).
 */
export function DashboardShell({
  subtitle,
  actions,
  onSignOut,
  children,
}: {
  subtitle: string;
  actions?: React.ReactNode;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div
        className="sticky top-0 z-20 border-b px-6 py-4 flex items-center gap-3 flex-wrap"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))" }}
        >
          <Leaf className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="font-serif text-base tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Code Blossom
          </h1>
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {subtitle}
          </p>
        </div>

        {actions}

        {/* Staff can open either garden as a participant sees it. `garden: true`
            stops the route bouncing them straight back here. */}
        <button
          type="button"
          onClick={() => navigate({ to: "/", search: { garden: true } })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
          style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
          title="Preview the Full Stack garden"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Full Stack</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/cf", search: { garden: true } })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
          style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
          title="Preview the Coding Fundamentals garden"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CF</span>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-colors"
          style={{ color: "var(--muted-foreground)" }}
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="p-2 rounded-xl transition-colors"
          style={{ color: "var(--muted-foreground)" }}
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {children}
    </div>
  );
}

export function DashboardSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary)" }}
      />
    </div>
  );
}

/** Tab strip used for the top-level views on both dashboards. */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {tabs.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: active === value ? "var(--primary)" : "var(--sidebar)",
            color: active === value ? "white" : "var(--muted-foreground)",
            border: "1px solid var(--sidebar-border)",
          }}
          aria-current={active === value ? "page" : undefined}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
