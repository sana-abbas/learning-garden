// Supabase Edge Function — notify admin/mentor when a participant claims a founders call
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — from resend.com (free plan covers 100 emails/day)
//   ADMIN_EMAILS     — comma-separated list, e.g. "mentor@school.com,admin@school.com"
//   FROM_EMAIL       — verified sender address in Resend, e.g. "noreply@yourdomain.com"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { callName, callVariant, userName, userEmail } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@example.com";

    if (!RESEND_API_KEY || adminEmails.length === 0) {
      console.log(`[notify-call-claim] Email not configured. Claim received from ${userName} <${userEmail}> for ${callName}`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmails,
        subject: `🌱 ${userName} claimed the ${callName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #3a6b35;">New Founders' Call Claim</h2>
            <p>
              <strong>${userName}</strong>
              ${userEmail ? `(<a href="mailto:${userEmail}">${userEmail}</a>)` : ""}
              has claimed their spot for the <strong>${callName}</strong>.
            </p>
            <p style="color: #666;">Please reach out to them with the call details.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #999;">
              This notification was sent by Code Blossom Learning Garden.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[notify-call-claim] Resend error:", text);
    }

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-call-claim] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
