// Supabase Edge Function — copy the Notion participant roster into Postgres.
//
// Notion ("👥 Participants: On & Offboarding") owns each participant's status,
// track, country, mentor and outcomes. The founder dashboard needs to join
// that against user_progress, which a browser cannot do: the Notion token must
// not ship to the client, Notion has no CORS, and the join belongs in SQL.
// So this runs server-side and mirrors the roster into notion_participants.
//
// It never writes to Notion.
//
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   NOTION_TOKEN     — internal integration token; the integration must be
//                      shared with the Participants database in Notion
//                      (••• → Connections → your integration)
//   SYNC_SECRET      — any long random string; lets the cron job call this
//                      without a user session
//
// Optional (defaults point at the current database):
//   NOTION_PARTICIPANTS_DATA_SOURCE_ID   default c794e850-b75d-48f0-a50b-574f8efe7681
//   NOTION_PARTICIPANTS_DATABASE_ID      default f7529f9db45749f58618410e72e3d123
//   NOTION_VERSION                       default 2025-09-03
//
// Provided by the platform: SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY.
//
// Callable two ways:
//   * a signed-in founder (the dashboard's Refresh button) — the caller's JWT
//     is checked against public.is_founder();
//   * a scheduled job sending `x-sync-secret: <SYNC_SECRET>`.
//
// Deploy with JWT verification OFF, because the cron job has no user session:
//   supabase functions deploy sync-notion-participants --no-verify-jwt
// That is safe here and not a shortcut — the handler below authorises every
// request itself, and a caller with neither the secret nor a founder session
// gets a 403 before anything is read or written. Success returns only counts,
// never participant data.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ── Notion property readers ──────────────────────────────────────────────────
// Notion returns a tagged union per property. These narrow it to the one shape
// we want and return null rather than throwing on an unexpected type, so a
// property renamed or retyped in Notion degrades to an empty cell instead of
// failing the whole sync.

type NotionProp = Record<string, unknown> & { type?: string };
type NotionPage = { id: string; url?: string; properties?: Record<string, NotionProp> };

function richText(prop: NotionProp | undefined): string | null {
  const parts = (prop?.rich_text ?? prop?.title) as { plain_text?: string }[] | undefined;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((p) => p.plain_text ?? "").join("").trim();
  return text || null;
}

function plainText(prop: NotionProp | undefined): string | null {
  // "Email" is a rich_text property in this database, but an `email`-typed
  // column would be a reasonable future change — accept either.
  if (typeof prop?.email === "string") return prop.email.trim() || null;
  if (typeof prop?.url === "string") return prop.url.trim() || null;
  return richText(prop);
}

function selectName(prop: NotionProp | undefined): string | null {
  const sel = (prop?.select ?? prop?.status) as { name?: string } | null | undefined;
  return sel?.name ?? null;
}

function dateStart(prop: NotionProp | undefined): string | null {
  const d = prop?.date as { start?: string } | null | undefined;
  if (!d?.start) return null;
  // Notion may return a datetime; notion_participants.start_date is a date.
  return d.start.slice(0, 10);
}

function numberValue(prop: NotionProp | undefined): number | null {
  return typeof prop?.number === "number" ? prop.number : null;
}

// ── Notion fetch ─────────────────────────────────────────────────────────────

async function fetchAllPages(token: string): Promise<NotionPage[]> {
  const dataSourceId = Deno.env.get("NOTION_PARTICIPANTS_DATA_SOURCE_ID")
    ?? "c794e850-b75d-48f0-a50b-574f8efe7681";
  const databaseId = Deno.env.get("NOTION_PARTICIPANTS_DATABASE_ID")
    ?? "f7529f9db45749f58618410e72e3d123";
  const version = Deno.env.get("NOTION_VERSION") ?? "2025-09-03";

  // The database has more than one data source, so the data_sources endpoint is
  // the correct one — it names which of them we mean. Older integrations that
  // do not know that endpoint fall back to querying the database itself.
  const endpoints = [
    { url: `https://api.notion.com/v1/data_sources/${dataSourceId}/query`, version },
    { url: `https://api.notion.com/v1/databases/${databaseId}/query`, version: "2022-06-28" },
  ];

  let lastError = "";
  for (const endpoint of endpoints) {
    const pages: NotionPage[] = [];
    let cursor: string | undefined;
    let failed = false;

    do {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": endpoint.version,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      });

      if (!res.ok) {
        lastError = `${endpoint.url} → ${res.status} ${await res.text()}`;
        failed = true;
        break;
      }

      const body = await res.json() as { results?: NotionPage[]; next_cursor?: string | null; has_more?: boolean };
      pages.push(...(body.results ?? []));
      cursor = body.has_more ? (body.next_cursor ?? undefined) : undefined;
    } while (cursor);

    if (!failed) return pages;
  }

  throw new Error(`Notion query failed. ${lastError}`);
}

// ── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── Authorise ──
  // Either the shared cron secret, or a signed-in founder. is_founder() is the
  // same check the dashboard's RLS uses, so there is one definition of "founder".
  const syncSecret = Deno.env.get("SYNC_SECRET");
  const presentedSecret = req.headers.get("x-sync-secret");
  let authorised = !!syncSecret && presentedSecret === syncSecret;

  if (!authorised) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authorised." }, 401);

    const asCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isFounder } = await asCaller.rpc("is_founder");
    authorised = isFounder === true;
  }

  if (!authorised) return json({ error: "Founders only." }, 403);

  const admin = createClient(supabaseUrl, serviceKey);
  const startedAt = new Date().toISOString();

  try {
    const token = Deno.env.get("NOTION_TOKEN");
    if (!token) throw new Error("NOTION_TOKEN is not set.");

    const pages = await fetchAllPages(token);

    const rows = pages.map((page) => {
      const props = page.properties ?? {};

      return {
        notion_page_id: page.id,
        notion_page_url: page.url ?? null,
        full_name: richText(props["Full Name"]),
        email: plainText(props["Email"]),
        country: plainText(props["Country"]),
        track: selectName(props["Curriculum Track"]),
        status: selectName(props["Status"]),
        start_date: dateStart(props["Start Date"]),
        mentor: selectName(props["Mentor"]),
        paid_project_1: selectName(props["1st Paid Project"]),
        paid_project_2: selectName(props["2nd Paid Project"]),
        // Working | Not Working | Not in touch, or null when unset. Null is
        // carried through as null rather than defaulted: "not recorded" and
        // "not working" are different answers.
        job_status: selectName(props["Job Status"]),
        tenure_years: numberValue(props["Tenure (Years)"]),
        // `raw` still keeps every property Notion returns, so nothing is lost
        // by not giving each one a typed column.
        raw: props,
        synced_at: startedAt,
      };
    });

    // Upsert in batches — one 219-row request works today, but the roster only
    // grows and a single oversized body is a silent cliff.
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await admin
        .from("notion_participants")
        .upsert(rows.slice(i, i + 100), { onConflict: "notion_page_id" });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
    }

    // Rows deleted in Notion. Only safe because every fetched row was just
    // written with synced_at = startedAt, and any failure above threw before
    // getting here — so this can never empty the table on a partial sync.
    const { error: pruneError, count: pruned } = await admin
      .from("notion_participants")
      .delete({ count: "exact" })
      .lt("synced_at", startedAt);
    if (pruneError) throw new Error(`Prune failed: ${pruneError.message}`);

    await admin.from("notion_sync_state").upsert({
      id: "participants",
      last_synced_at: startedAt,
      last_status: "ok",
      last_error: null,
      row_count: rows.length,
      updated_at: new Date().toISOString(),
    });

    return json({ ok: true, synced: rows.length, pruned: pruned ?? 0, at: startedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-notion-participants]", message);

    // Record the failure so the dashboard shows "sync failed" instead of
    // presenting yesterday's numbers as today's.
    await admin.from("notion_sync_state").upsert({
      id: "participants",
      last_status: "error",
      last_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    });

    return json({ error: message }, 500);
  }
});
