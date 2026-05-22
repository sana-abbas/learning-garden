// Supabase Edge Function — notify mentor/admin when a participant saves a chapter reflection
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
    const { chapterTitle, noteText, userName, userEmail } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@example.com";

    if (!RESEND_API_KEY || adminEmails.length === 0) {
      console.log(`[notify-note-saved] Email not configured. Note from ${userName} <${userEmail}> on "${chapterTitle}": ${noteText}`);
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
        subject: `💬 ${userName} left a reflection on "${chapterTitle}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #3a6b35;">New Chapter Reflection</h2>
            <p>
              <strong>${userName}</strong>
              ${userEmail ? `(<a href="mailto:${userEmail}">${userEmail}</a>)` : ""}
              saved a note on <strong>${chapterTitle}</strong>:
            </p>
            <blockquote style="
              margin: 16px 0;
              padding: 14px 18px;
              background: #f7faf7;
              border-left: 4px solid #4caf72;
              border-radius: 0 8px 8px 0;
              color: #333;
              font-style: italic;
              line-height: 1.6;
            ">
              ${noteText.replace(/\n/g, "<br />")}
            </blockquote>
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
      console.error("[notify-note-saved] Resend error:", text);
    }

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-note-saved] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
