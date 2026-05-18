import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) window.location.replace("/");
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message || "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)] px-4">
      <div className="max-w-md w-full bg-[color:var(--sidebar)] rounded-3xl border border-[color:var(--sidebar-border)] p-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
              boxShadow: "var(--shadow-leaf)",
            }}
          >
            <Leaf className="w-7 h-7 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="font-serif text-3xl tracking-tight text-[color:var(--sidebar-foreground)]">
            Welcome to Code Blossom
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-2 mb-8">
            Sign in to tend your garden and track your learning.
          </p>

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-[color:var(--sidebar-border)] bg-white px-4 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[oklch(0.97_0.015_85)] transition-colors disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.7 13-4.7l-6-5.1c-2 1.4-4.4 2.3-7 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6 5.1c-.4.4 6.7-4.9 6.7-14.7 0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-4 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
