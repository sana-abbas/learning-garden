// Supabase Edge Function — notify mentor/admin when a participant submits an assignment
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — from resend.com
//   ADMIN_EMAILS     — comma-separated list, e.g. "mentor@school.com,admin@school.com"
//   FROM_EMAIL       — verified sender address in Resend

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
    const { chapterTitle, subtaskLabel, link, link2, video, userName, userEmail } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@example.com";

    if (!RESEND_API_KEY || adminEmails.length === 0) {
      console.log(`[notify-assignment-submitted] Email not configured. Submission from ${userName} <${userEmail}> on "${subtaskLabel}" (${chapterTitle})`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submissionRows = [
      link ? `<tr><td style="padding: 8px 0; color: #666; font-size: 13px; white-space: nowrap; padding-right: 16px;">Link</td><td style="padding: 8px 0;"><a href="${link}" style="color: #4caf72;">${link}</a></td></tr>` : "",
      link2 ? `<tr><td style="padding: 8px 0; color: #666; font-size: 13px; white-space: nowrap; padding-right: 16px;">Live demo</td><td style="padding: 8px 0;"><a href="${link2}" style="color: #4caf72;">${link2}</a></td></tr>` : "",
      video ? `<tr><td style="padding: 8px 0; color: #666; font-size: 13px; white-space: nowrap; padding-right: 16px;">Video</td><td style="padding: 8px 0;"><a href="${video}" style="color: #4caf72;">${video}</a></td></tr>` : "",
    ].filter(Boolean).join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmails,
        subject: `📎 ${userName} submitted an assignment — ${chapterTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #3a6b35;">New Assignment Submission</h2>
            <p>
              <strong>${userName}</strong>
              ${userEmail ? `(<a href="mailto:${userEmail}">${userEmail}</a>)` : ""}
              submitted an assignment for <strong>${chapterTitle}</strong>:
            </p>
            <p style="font-size: 13px; color: #555; margin: 4px 0 16px;">
              ${subtaskLabel}
            </p>
            <table style="width: 100%; border-collapse: collapse; background: #f7faf7; border-radius: 8px; padding: 12px; border: 1px solid #e0ede0;">
              <tbody>
                ${submissionRows}
              </tbody>
            </table>
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
      console.error("[notify-assignment-submitted] Resend error:", text);
    }

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-assignment-submitted] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
