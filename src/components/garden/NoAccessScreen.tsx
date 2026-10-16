import { Leaf } from "lucide-react";

/**
 * Shown instead of the garden to someone who is signed in but not on the
 * access list — never invited, or removed by a mentor. The garden is
 * invite-only, so the only way in is for a mentor to add this email.
 */
export function NoAccessScreen({
  email,
  onSignOut,
}: {
  email: string | null | undefined;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[color:var(--background)]">
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-11 h-11 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.92 0.07 145 / 0.4)" }}
        >
          <Leaf className="w-5 h-5" style={{ color: "var(--primary)" }} />
        </div>
        <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Your garden isn't open yet
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
          {email ? (
            <>
              <strong style={{ color: "var(--foreground)" }}>{email}</strong> doesn't have access.
            </>
          ) : (
            "This account doesn't have access."
          )}{" "}
          Ask your mentor to add you, then try again. If you signed in with a different email
          before, sign out and use that one.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--primary)" }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{ border: "1px solid var(--sidebar-border)", color: "var(--muted-foreground)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
