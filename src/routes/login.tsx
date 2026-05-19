import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) window.location.replace("/");
    });
    return () => subscription.unsubscribe();
  }, []);

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
          <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
            Sign-in is currently unavailable.
          </p>
        </div>
      </div>
    </div>
  );
}
