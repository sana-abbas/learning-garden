import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Leaf,
  ChevronDown,
  MessageCircle,
  LogOut,
  Moon,
  Sun,
  Flame,
  RefreshCw,
  Send,
  Check,
  Menu,
  X,
  ClipboardList,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useProgress } from "@/hooks/useProgress";
import confetti from "canvas-confetti";
import { BotanicalGarden } from "@/components/garden/BotanicalGarden";
import { SubmissionModal } from "@/components/garden/SubmissionModal";
import { ContentModal } from "@/components/garden/ContentModal";
import { DailyUpdateModal } from "@/components/garden/DailyUpdateModal";
import { CF_STEPS, CF_CURRICULUM_STEPS } from "@/data/curriculum-cf";
import { CF_CONTENT } from "@/data/content-cf";
import type { Step, SubTask } from "@/data/curriculum";

export const Route = createFileRoute("/cf")({
  validateSearch: (search: Record<string, unknown>) => ({
    garden: search.garden === "1" || search.garden === true || search.garden === "true",
  }),
  component: CodingFundamentals,
});

// ── helpers ──────────────────────────────────────────────────────────────────

function fireConfetti() {
  confetti({
    particleCount: 90,
    spread: 65,
    origin: { y: 0.45, x: 0.25 },
    colors: ["#4ade80", "#86efac", "#f472b6", "#a78bfa", "#fbbf24", "#34d399"],
  });
}

const QUOTES = [
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "Code is like humour. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Progress, not perfection.", author: null },
  { text: "Small steps every day add up to big leaps.", author: null },
  { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: null },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Learning to code is learning to think.", author: "Steve Jobs" },
  { text: "Consistency beats intensity every time.", author: null },
  { text: "Future you is going to thank present you.", author: null },
  { text: "You are literally rewiring your brain right now.", author: null },
  { text: "Every checkbox is a seed planted. 🌱", author: null },
  { text: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" },
  { text: "Good judgment comes from experience, and experience comes from bad judgment.", author: null },
];

function showRandomQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  toast(q.text, {
    description: q.author ? `(${q.author})` : undefined,
    icon: "🌱",
    duration: 4000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

function CodingFundamentals() {
  const navigate = useNavigate();
  const { garden } = Route.useSearch();
  const { theme, toggle: toggleTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [submissionModal, setSubmissionModal] = useState<{
    step: Step;
    sub: SubTask;
  } | null>(null);
  const [contentModal, setContentModal] = useState<{
    title: string;
    content: string;
    gate?: import("@/components/garden/SubmissionModal").SubmissionGate;
    step?: Step;
    sub?: SubTask;
    subId?: string;
  } | null>(null);

  const {
    checked, setChecked, notes, setNotes,
    submissions, setSubmission,
    streak, bumpStreak, syncing, saveNow,
    onboarded, progressReady, setOnboarded,
  } = useProgress(userId);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [todayUpdate, setTodayUpdate] = useState<{ today: string; tomorrow: string; blockers: string | null } | null | undefined>(undefined);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<"curriculum" | "community">("curriculum");
  type CommunityMember = { user_id: string; firstName: string; chaptersCompleted: number; isMe: boolean };
  type CommunityUpdate = { user_id: string; firstName: string; date: string; today: string; tomorrow: string; blockers: string | null };
  type Reaction = { update_user_id: string; update_date: string; reactor_user_id: string; emoji: string };
  type CommunityComment = { id: string; update_user_id: string; update_date: string; commenter_user_id: string; commenter_name: string; text: string; created_at: string };
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[] | null>(null);
  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[] | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [communityComments, setCommunityComments] = useState<CommunityComment[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [communityFilterDate, setCommunityFilterDate] = useState<string>("");
  const [communityPage, setCommunityPage] = useState(0);
  const COMMUNITY_PAGE_SIZE = 10;
  const completionShownRef = useRef(false);

  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const savedNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);
  const savedFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSaveFeedback = async (stepId: string) => {
    await saveNow();
    if (savedFeedbackTimer.current) clearTimeout(savedFeedbackTimer.current);
    setSavedFeedbackId(stepId);
    savedFeedbackTimer.current = setTimeout(() => setSavedFeedbackId(null), 2000);
  };

  const handleSaveNote = async (stepId: string) => {
    await saveNow();
    if (savedNoteTimer.current) clearTimeout(savedNoteTimer.current);
    setSavedNoteId(stepId);
    savedNoteTimer.current = setTimeout(() => setSavedNoteId(null), 2000);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [bloomBurst, setBloomBurst] = useState(false);
  const prevCompletionRef = useRef<Record<string, boolean>>({});
  const skipNextBloom = useRef(false);
  const bloomInitializedFor = useRef<string | null>(null);

  // Auth guard — redirect to /login if not signed in, / if wrong cohort
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: mentorRow } = await supabase
        .from("mentors").select("id").eq("user_id", session.user.id).maybeSingle();
      if (mentorRow) setIsMentor(true);
      if (!mentorRow) {
        // Check existing cohort assignment first
        const { data: member } = await supabase
          .from("cohort_members")
          .select("cohort_id, cohorts(slug)")
          .eq("user_id", session.user.id)
          .maybeSingle();
        const existingSlug = (member as any)?.cohorts?.slug;
        // Only hard-redirect if we can positively confirm full-stack membership
        if (existingSlug === "full-stack") { navigate({ to: "/" }); return; }
        // New student — auto-enroll from invite list
        if (!member && session.user.email) {
          const { data: invite } = await supabase
            .from("cohort_invites")
            .select("cohort_id, cohorts(slug)")
            .eq("email", session.user.email.toLowerCase())
            .maybeSingle();
          const inviteSlug = (invite as any)?.cohorts?.slug;
          if (inviteSlug === "full-stack") {
            // Explicitly invited to full-stack → redirect
            navigate({ to: "/" });
            return;
          }
          if (invite && inviteSlug === "coding-fundamentals") {
            // Auto-enroll CF student
            await supabase.from("cohort_members").insert({ user_id: session.user.id, cohort_id: (invite as any).cohort_id });
          }
          // If invite not found or slug unrecognised, allow through — admin may have
          // added them directly to cohort_members by user_id already, or invite table
          // is being set up. Don't punish the participant for a DB gap.
        }
      }
      // Save profile on login
      const name = (session.user.user_metadata?.full_name as string | undefined) ?? session.user.email?.split("@")[0] ?? "Gardener";
      const avatarUrl = (session.user.user_metadata?.avatar_url as string | undefined) ?? null;
      supabase.from("user_progress").upsert(
        { user_id: session.user.id, display_name: name, email: session.user.email, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      ).then(() => {});
      setUserId(session.user.id);
      setUser(session.user);
      setAuthReady(true);

      // Fetch today's daily update
      const dateStr = new Date().toISOString().split("T")[0];
      supabase
        .from("daily_updates")
        .select("today, tomorrow, blockers")
        .eq("user_id", session.user.id)
        .eq("date", dateStr)
        .maybeSingle()
        .then(({ data }) => setTodayUpdate(data ?? null));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        setUserId(session.user.id);
        setUser(session.user);
        setAuthReady(true);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, garden]);

  useEffect(() => {
    return () => {
      if (savedNoteTimer.current) clearTimeout(savedNoteTimer.current);
    };
  }, []);

  // Show welcome modal for new users; setOnboarded() fires on dismiss
  useEffect(() => {
    if (!onboarded && progressReady) {
      setShowWelcomeModal(true);
    }
  }, [onboarded, progressReady]);

  const getFirstName = (displayName: string | null, email: string | null) =>
    displayName?.split(" ")[0] || email?.split("@")[0] || "Someone";

  const computeChapters = (checked: Record<string, boolean>) =>
    CF_CURRICULUM_STEPS.filter((s) => {
      const step = CF_STEPS.find((x) => x.id === s.id);
      if (!step) return false;
      return step.subtasks?.length ? step.subtasks.every((sub) => checked[sub.id]) : !!checked[step.id];
    }).length;

  const loadCommunity = async () => {
    if (communityMembers !== null || communityLoading) return;
    setCommunityLoading(true);
    // Get CF cohort ID then members
    const { data: cohortRow } = await supabase
      .from("cohorts")
      .select("id")
      .eq("slug", "coding-fundamentals")
      .maybeSingle();
    if (!cohortRow) { setCommunityMembers([]); setCommunityLoading(false); return; }
    const { data: memberRows } = await supabase
      .from("cohort_members")
      .select("user_id")
      .eq("cohort_id", cohortRow.id);
    const cfUserIds = (memberRows ?? []).map((r: any) => r.user_id as string);

    if (cfUserIds.length === 0) { setCommunityMembers([]); setCommunityLoading(false); return; }

    // Fetch progress for all CF members
    const { data: progressRows } = await supabase
      .from("user_progress")
      .select("user_id, display_name, email, checked")
      .in("user_id", cfUserIds);

    const members: CommunityMember[] = (progressRows ?? []).map((p: any) => ({
      user_id: p.user_id,
      firstName: getFirstName(p.display_name, p.email),
      chaptersCompleted: computeChapters((p.checked as Record<string, boolean>) ?? {}),
      isMe: p.user_id === userId,
    })).sort((a: CommunityMember, b: CommunityMember) => b.chaptersCompleted - a.chaptersCompleted);

    // Fetch recent daily updates for CF members
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];

    const { data: updateRows } = await supabase
      .from("daily_updates")
      .select("user_id, date, today, tomorrow, blockers, display_name")
      .in("user_id", cfUserIds)
      .gte("date", cutoff)
      .order("date", { ascending: false })
      .limit(50);

const nameMap = Object.fromEntries((progressRows ?? []).map((p: any) => [p.user_id, getFirstName(p.display_name, p.email)]));
    const updates: CommunityUpdate[] = (updateRows ?? []).map((u: any) => ({
      ...u,
      firstName: u.display_name?.split(" ")[0] || nameMap[u.user_id] || "Someone",
    }));

    // Fetch reactions and comments for these updates
    const { data: reactionRows } = await supabase
      .from("update_reactions")
      .select("update_user_id, update_date, reactor_user_id, emoji")
      .in("update_user_id", cfUserIds)
      .gte("update_date", cutoff);

    const { data: commentRows } = await supabase
      .from("update_comments")
      .select("id, update_user_id, update_date, commenter_user_id, commenter_name, text, created_at")
      .in("update_user_id", cfUserIds)
      .gte("update_date", cutoff)
      .order("created_at", { ascending: true });

    setCommunityMembers(members);
    setCommunityUpdates(updates);
    setReactions((reactionRows ?? []) as Reaction[]);
    setCommunityComments((commentRows ?? []) as CommunityComment[]);
    setCommunityLoading(false);
  };

  const toggleReaction = async (updateUserId: string, updateDate: string, emoji: string) => {
    if (!userId) return;
    const isReacted = reactions.some(r =>
      r.update_user_id === updateUserId && r.update_date === updateDate && r.emoji === emoji && r.reactor_user_id === userId
    );
    if (isReacted) {
      setReactions(prev => prev.filter(r => !(r.update_user_id === updateUserId && r.update_date === updateDate && r.emoji === emoji && r.reactor_user_id === userId)));
      await supabase.from("update_reactions").delete()
        .eq("update_user_id", updateUserId).eq("update_date", updateDate).eq("reactor_user_id", userId).eq("emoji", emoji);
    } else {
      setReactions(prev => [...prev, { update_user_id: updateUserId, update_date: updateDate, reactor_user_id: userId, emoji }]);
      await supabase.from("update_reactions").insert({ update_user_id: updateUserId, update_date: updateDate, reactor_user_id: userId, emoji });
    }
  };

  const submitComment = async (updateUserId: string, updateDate: string) => {
    const key = `${updateUserId}_${updateDate}`;
    const text = commentDrafts[key]?.trim();
    if (!text || !userId) return;
    setSubmittingComment(key);
    const firstName = communityMembers?.find(m => m.user_id === userId)?.firstName || displayName.split(" ")[0] || "Someone";
    const { data, error } = await supabase.from("update_comments").insert({
      update_user_id: updateUserId,
      update_date: updateDate,
      commenter_user_id: userId,
      commenter_name: firstName,
      text,
    }).select().single();
    if (!error && data) {
      setCommunityComments(prev => [...prev, data as CommunityComment]);
      setCommentDrafts(prev => ({ ...prev, [key]: "" }));
    }
    setSubmittingComment(null);
  };

  const completion = useMemo(() => {
    const map: Record<string, boolean> = {};
    CF_STEPS.forEach((s) => {
      if (s.subtasks && s.subtasks.length > 0) {
        map[s.id] = s.subtasks.every((sub) => checked[sub.id]);
      } else {
        map[s.id] = !!checked[s.id];
      }
    });
    return map;
  }, [checked]);

  const chaptersRemaining = useMemo(
    () => CF_CURRICULUM_STEPS.filter((s) => !completion[s.id]).length,
    [completion],
  );

  // Detect newly completed chapters → bloom burst
  useEffect(() => {
    const prev = prevCompletionRef.current;
    prevCompletionRef.current = { ...completion };

    if (bloomInitializedFor.current !== userId) {
      if (progressReady) {
        prevCompletionRef.current = { ...completion };
        bloomInitializedFor.current = userId;
      }
      return;
    }

    if (skipNextBloom.current) {
      skipNextBloom.current = false;
      return;
    }

    const justCompleted = CF_STEPS.filter((s) => completion[s.id] && !prev[s.id]);
    if (justCompleted.length > 0) {
      setBloomBurst(true);
      const t = setTimeout(() => setBloomBurst(false), 3200);
      return () => clearTimeout(t);
    }
  }, [completion, progressReady, userId]);

  // Show completion modal once when entire curriculum is done
  useEffect(() => {
    if (!progressReady || !userId || completionShownRef.current) return;
    if (chaptersRemaining === 0) {
      const key = `cf-complete-shown-${userId}`;
      if (!localStorage.getItem(key)) {
        completionShownRef.current = true;
        setShowCompleteModal(true);
        localStorage.setItem(key, "1");
      }
    }
  }, [chaptersRemaining, progressReady, userId]);

  // Bump streak on app open
  useEffect(() => {
    if (progressReady && userId) {
      bumpStreak();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressReady, userId]);

  const toggleSubtask = (step: Step, sub: SubTask) => {
    const subId = sub.id;
    if (checked[subId]) {
      setChecked((prev) => ({ ...prev, [subId]: false }));
      return;
    }
    if (sub.gate) {
      setSubmissionModal({ step, sub });
      return;
    }
    setChecked((prev) => {
      const next = { ...prev, [subId]: true };
      if (step.subtasks && step.kind === "module") {
        const allDone = step.subtasks.every((s) => next[s.id]);
        if (allDone) setTimeout(fireConfetti, 300);
      }
      return next;
    });
    bumpStreak();
    showRandomQuote();
  };

  const toggleStep = (step: Step) => {
    if (step.subtasks && step.subtasks.length > 0) {
      const allDone = step.subtasks.every((s) => checked[s.id]);
      if (!allDone) {
        const firstPendingGate = step.subtasks.find(
          (s) => s.gate && !checked[s.id] && !submissions[s.id],
        );
        if (firstPendingGate) {
          setSubmissionModal({ step, sub: firstPendingGate });
          return;
        }
      }
      setChecked((prev) => {
        const next = { ...prev };
        step.subtasks!.forEach((s) => (next[s.id] = !allDone));
        return next;
      });
      if (!allDone) setTimeout(fireConfetti, 300);
      if (!allDone) bumpStreak();
      return;
    }
    setChecked((prev) => {
      const wasChecked = !!prev[step.id];
      if (!wasChecked) setTimeout(fireConfetti, 300);
      return { ...prev, [step.id]: !wasChecked };
    });
    if (!checked[step.id]) bumpStreak();
  };

  const confirmSubmission = (step: Step, sub: SubTask, data: import("@/hooks/useProgress").Submission) => {
    setSubmission(sub.id, { ...data, submittedAt: new Date().toISOString() });
    setChecked((prev) => {
      const next = { ...prev, [sub.id]: true };
      if (step.subtasks && step.kind === "module") {
        const allDone = step.subtasks.every((s) => next[s.id]);
        if (allDone) setTimeout(fireConfetti, 300);
      }
      return next;
    });
    bumpStreak();
    showRandomQuote();
  };

  const handleSubmissionConfirm = async (data: import("@/hooks/useProgress").Submission) => {
    if (!submissionModal) return;
    confirmSubmission(submissionModal.step, submissionModal.sub, data);
    setSubmissionModal(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!authReady || !progressReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="w-6 h-6 rounded-full border-2 border-[color:var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const completedCount = CF_CURRICULUM_STEPS.filter((s) => completion[s.id]).length;
  const progress = (completedCount / CF_CURRICULUM_STEPS.length) * 100;

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "Gardener";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const lastActive = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  // Garden stage mapping for CF curriculum
  const rootsActive = completion["cf0"] || completion["cf1"];
  const sproutActive = completion["cf2"] && completion["cf3"];
  const stemActive = completion["cf7"] && completion["cf8"];
  const flowerActive = completion["cf12"] && completion["cf13"];
  const exoticActive = completion["cf15"] && completion["cf16"];

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--background)] flex flex-col lg:flex-row">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[400px] flex flex-col
        bg-[color:var(--sidebar)] border-r border-[color:var(--sidebar-border)]
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${sidebarTab === "community" ? "lg:hidden" : "lg:static lg:w-[420px] lg:translate-x-0 lg:shrink-0"}
      `}>
        <div className="p-6 border-b border-[color:var(--sidebar-border)] shrink-0 bg-[color:var(--sidebar)] z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
                boxShadow: "var(--shadow-leaf)",
              }}
            >
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-lg tracking-tight text-[color:var(--sidebar-foreground)]">
                Code Blossom
              </h1>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                Coding Fundamentals
              </p>
            </div>
            {/* Close button — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[color:var(--muted-foreground)] hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Back to dashboard button — visible to mentors */}
          {isMentor && (
            <button
              type="button"
              onClick={() => navigate({ to: "/mentor" })}
              className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[color:var(--muted-foreground)] hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] transition-colors border border-[color:var(--sidebar-border)]"
            >
              ← Back to mentor dashboard
            </button>
          )}

          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Progress
              </span>
              <span className="text-xs font-mono text-[color:var(--muted-foreground)]">
                {completedCount}/{CF_CURRICULUM_STEPS.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[oklch(0.88_0.04_85)] dark:bg-[oklch(0.27_0.03_65)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--bloom-pink))",
                }}
              />
            </div>
            {chaptersRemaining > 0 && (
              <p className="text-[10px] text-[color:var(--muted-foreground)] mt-1.5 text-right">
                {chaptersRemaining} chapter{chaptersRemaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {sidebarTab === "curriculum" && CF_STEPS.map((step, i) => {
            const isChecked = completion[step.id];
            const Icon = step.icon;
            const hasSubs = !!(step.subtasks && step.subtasks.length);
            const isOpen = openId === step.id;
            const subDone = hasSubs
              ? step.subtasks!.filter((s) => checked[s.id]).length
              : 0;

            const titleContent = (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-sm font-medium truncate transition-colors ${
                      isChecked
                        ? "text-[color:var(--foreground)]"
                        : "text-[color:var(--sidebar-foreground)]"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
                <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5 truncate">
                  {`${step.subtitle}${hasSubs ? ` · ${subDone}/${step.subtasks!.length}` : ""}`}
                </div>
              </>
            );

            return (
              <div
                key={step.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isChecked
                    ? "bg-[color:var(--sidebar-accent)] border-[color:var(--primary)]/30 shadow-sm"
                    : "border-transparent hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] hover:border-[color:var(--sidebar-border)]"
                }`}
              >
                <div className="group flex items-center gap-3.5 p-3.5">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleStep(step)}
                    className="w-5 h-5 rounded-md border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
                  />
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isChecked ? "scale-105" : "opacity-70"
                    }`}
                    style={{
                      background: isChecked
                        ? "linear-gradient(135deg, var(--primary), var(--leaf-light))"
                        : theme === "dark" ? "oklch(0.24 0.03 65)" : "oklch(0.9 0.03 85)",
                      color: isChecked ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : step.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      {titleContent}
                    </button>
                  ) : (
                    <div className="flex-1 min-w-0">{titleContent}</div>
                  )}
                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : step.id)}
                      className="p-1 rounded-md hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] cursor-pointer shrink-0"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-[color:var(--muted-foreground)] transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-[color:var(--muted-foreground)]/70 shrink-0">
                      {String(i).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {hasSubs && isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-[color:var(--sidebar-border)]/60 mt-1">
                    <ul className="space-y-1.5 pt-3">
                      {step.subtasks!.map((sub) => {
                        const subChecked = !!checked[sub.id];
                        return (
                          <li key={sub.id}>
                            <label className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-[oklch(0.94_0.02_85)] dark:hover:bg-[oklch(0.27_0.03_65)] transition-colors">
                              <Checkbox
                                checked={subChecked}
                                onCheckedChange={() => toggleSubtask(step, sub)}
                                className="w-4 h-4 mt-0.5 rounded border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
                              />
                              <span className="flex-1">
                                {(() => {
                                  const hasContent = !!CF_CONTENT[sub.id];
                                  const labelClass = `text-[12.5px] leading-snug transition-all ${
                                    subChecked
                                      ? "text-[color:var(--muted-foreground)] line-through decoration-[color:var(--primary)]/50"
                                      : "text-[color:var(--sidebar-foreground)]"
                                  }`;
                                  if (hasContent && !subChecked) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setContentModal({ title: sub.label, content: CF_CONTENT[sub.id], gate: sub.gate, step, sub, subId: sub.id });
                                        }}
                                        className={`${labelClass} text-left underline underline-offset-2 decoration-[color:var(--primary)]/30 hover:decoration-[color:var(--primary)] cursor-pointer`}
                                      >
                                        {sub.label}
                                      </button>
                                    );
                                  }
                                  if (sub.url && !subChecked) {
                                    return (
                                      <a
                                        href={sub.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className={`${labelClass} underline underline-offset-2 decoration-[color:var(--primary)]/40 hover:decoration-[color:var(--primary)]`}
                                      >
                                        {sub.label}
                                      </a>
                                    );
                                  }
                                  return <span className={labelClass}>{sub.label}</span>;
                                })()}
                                {sub.gate && subChecked && submissions[sub.id] && (
                                  <span className="block text-[10px] text-[color:var(--primary)] mt-0.5 font-medium">
                                    ✓ Submitted
                                  </span>
                                )}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="pt-2">
                      <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1.5 font-medium">
                        <MessageCircle className="w-3 h-3" />
                        What's one thing we could do to improve this chapter?
                        <span className="text-[color:var(--destructive)] ml-0.5">*</span>
                      </label>
                      <textarea
                        value={notes[`${step.id}__fb`] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [`${step.id}__fb`]: e.target.value }))
                        }
                        placeholder="Share your thoughts…"
                        rows={2}
                        className="w-full text-[12px] leading-relaxed p-2.5 rounded-lg bg-[oklch(0.97_0.015_85)] dark:bg-[oklch(0.22_0.03_65)] border border-[color:var(--sidebar-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 focus:border-[color:var(--primary)]/40 resize-none placeholder:text-[color:var(--muted-foreground)]/60 text-[color:var(--sidebar-foreground)] transition-all"
                      />
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          disabled={!notes[`${step.id}__fb`]}
                          onClick={() => handleSaveFeedback(step.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                            savedFeedbackId === step.id
                              ? "bg-[color:var(--primary)]/15 text-[color:var(--primary)]"
                              : notes[`${step.id}__fb`]
                                ? "bg-[color:var(--sidebar-border)] hover:bg-[color:var(--primary)]/15 hover:text-[color:var(--primary)] text-[color:var(--muted-foreground)]"
                                : "opacity-40 cursor-not-allowed text-[color:var(--muted-foreground)]"
                          }`}
                        >
                          {savedFeedbackId === step.id ? (
                            <><Check className="w-3 h-3" /> Saved</>
                          ) : (
                            <><Send className="w-3 h-3" /> Submit</>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1.5 font-medium">
                        <MessageCircle className="w-3 h-3" />
                        How did this chapter feel?
                      </label>
                      <textarea
                        value={notes[step.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [step.id]: e.target.value }))
                        }
                        placeholder="Jot a reflection, an aha moment, or a question…"
                        rows={2}
                        className="w-full text-[12px] leading-relaxed p-2.5 rounded-lg bg-[oklch(0.97_0.015_85)] dark:bg-[oklch(0.22_0.03_65)] border border-[color:var(--sidebar-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 focus:border-[color:var(--primary)]/40 resize-none placeholder:text-[color:var(--muted-foreground)]/60 text-[color:var(--sidebar-foreground)] transition-all"
                      />
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          disabled={!notes[step.id]}
                          onClick={() => handleSaveNote(step.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                            savedNoteId === step.id
                              ? "bg-[color:var(--primary)]/15 text-[color:var(--primary)]"
                              : notes[step.id]
                                ? "bg-[color:var(--sidebar-border)] hover:bg-[color:var(--primary)]/15 hover:text-[color:var(--primary)] text-[color:var(--muted-foreground)]"
                                : "opacity-40 cursor-not-allowed text-[color:var(--muted-foreground)]"
                          }`}
                        >
                          {savedNoteId === step.id ? (
                            <><Check className="w-3 h-3" /> Saved</>
                          ) : (
                            <><Send className="w-3 h-3" /> Save note</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6">

        {/* Top bar */}
        <div className="shrink-0 flex items-center gap-2 mb-3">

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[color:var(--muted-foreground)] hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] hover:text-[color:var(--foreground)] transition-colors shrink-0"
            aria-label="Open curriculum"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="min-w-0">
              <h2 className="font-serif text-base lg:text-xl tracking-tight text-[color:var(--foreground)] leading-tight">
                Code. Learn. Bloom.
              </h2>
              <p className="hidden lg:block text-[11px] text-[color:var(--muted-foreground)] italic mt-0.5">
                {!rootsActive && "An empty plot, full of promise."}
                {rootsActive && !sproutActive && "Roots, quiet and luminous, take hold."}
                {sproutActive && !stemActive && "A sprout greets the morning sun."}
                {stemActive && !flowerActive && "Leaves unfurl toward the sky."}
                {flowerActive && !exoticActive && "First bloom — vivid and whole."}
                {exoticActive && "A secret garden, fully alive."}
              </p>
            </div>
            {/* Curriculum / Community toggle */}
            <div className="hidden lg:flex shrink-0 rounded-xl overflow-hidden border border-[color:var(--border)]" style={{ background: "var(--sidebar)" }}>
              {(["curriculum", "community"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setSidebarTab(tab); if (tab === "community") loadCommunity(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
                  style={{
                    background: sidebarTab === tab ? "var(--primary)" : "transparent",
                    color: sidebarTab === tab ? "white" : "var(--muted-foreground)",
                  }}
                >
                  {tab === "curriculum" ? <Leaf className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {syncing && (
              <span title="Syncing…">
                <RefreshCw className="w-3.5 h-3.5 text-[color:var(--muted-foreground)] animate-spin" />
              </span>
            )}

            {streak > 0 && (
              <div
                className="flex items-center gap-1 rounded-full font-semibold px-2.5 py-1.5 text-[12px]"
                title={`${streak}-day streak! Keep it up 🔥`}
                style={{
                  background: theme === "dark" ? "oklch(0.35 0.08 55 / 0.5)" : "oklch(0.95 0.08 60 / 0.3)",
                  color: theme === "dark" ? "oklch(0.88 0.14 70)" : "oklch(0.55 0.15 50)",
                }}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                {streak}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              title={todayUpdate ? "Edit today's update" : "Post daily update"}
              className="p-2 rounded-xl transition-colors"
              style={todayUpdate ? {
                color: "var(--primary)",
                background: theme === "dark" ? "oklch(0.32 0.08 145 / 0.5)" : "oklch(0.93 0.07 145 / 0.35)",
              } : {
                color: "var(--muted-foreground)",
              }}
            >
              <ClipboardList className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="hidden lg:block w-px h-7 bg-[color:var(--border)] mx-0.5" />

            {/* Avatar dropdown */}
            <div className="hidden lg:block relative">
              <button
                type="button"
                onClick={() => setAvatarMenuOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-2 ring-[color:var(--primary)]/30 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement)?.style.removeProperty("display"); }} />
                ) : null}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))", display: avatarUrl ? "none" : undefined }}>
                  {initials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[color:var(--foreground)] leading-tight">{displayName}</p>
                  {lastActive && <p className="text-[11px] text-[color:var(--muted-foreground)] leading-tight mt-0.5">Last active {lastActive}</p>}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[color:var(--muted-foreground)] ml-0.5" />
              </button>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 rounded-xl shadow-lg overflow-hidden min-w-[160px]"
                    style={{ background: "var(--sidebar)", border: "1px solid var(--border)" }}>
                    <button type="button" onClick={() => { toggleTheme(); setAvatarMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] transition-colors text-left"
                      style={{ color: "var(--foreground)" }}>
                      {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>
                    <div className="h-px mx-3" style={{ background: "var(--border)" }} />
                    <button type="button" onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] transition-colors text-left"
                      style={{ color: "var(--muted-foreground)" }}>
                      <LogOut className="w-4 h-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Garden / Community */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {sidebarTab === "community" ? (
            <div className="h-full overflow-y-auto p-6">
              {communityLoading ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Loading community…
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Filter toolbar */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "var(--sidebar)", border: "1px solid var(--border)" }}>
                      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Date</span>
                      <input
                        type="date"
                        value={communityFilterDate}
                        onChange={e => { setCommunityFilterDate(e.target.value); setCommunityPage(0); }}
                        className="text-xs bg-transparent focus:outline-none"
                        style={{ color: communityFilterDate ? "var(--foreground)" : "var(--muted-foreground)" }}
                      />
                    </div>
                    {communityFilterDate && (
                      <button
                        type="button"
                        onClick={() => { setCommunityFilterDate(""); setCommunityPage(0); }}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-xl"
                        style={{ background: "var(--sidebar)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                      >
                        Clear filter
                      </button>
                    )}
                    <span className="ml-auto text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {(() => {
                        const filtered = (communityUpdates ?? []).filter(u => !communityFilterDate || u.date === communityFilterDate);
                        return `${filtered.length} update${filtered.length !== 1 ? "s" : ""}`;
                      })()}
                    </span>
                  </div>

                  {(() => {
                    const filtered = (communityUpdates ?? []).filter(u => !communityFilterDate || u.date === communityFilterDate);
                    const totalPages = Math.ceil(filtered.length / COMMUNITY_PAGE_SIZE);
                    const paged = filtered.slice(communityPage * COMMUNITY_PAGE_SIZE, (communityPage + 1) * COMMUNITY_PAGE_SIZE);
                    return (
                      <>
                        {filtered.length === 0 && (
                          <p className="text-sm text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                            {communityFilterDate ? "No updates for this date." : "No updates in the last 7 days."}
                          </p>
                        )}
                        {paged.map((u, i) => {
                    const [y, mo, d] = u.date.split("-").map(Number);
                    const dateLabel = new Date(y, mo - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    const key = `${u.user_id}_${u.date}`;
                    const cardReactions = reactions.filter(r => r.update_user_id === u.user_id && r.update_date === u.date);
                    const cardComments = communityComments.filter(c => c.update_user_id === u.user_id && c.update_date === u.date);
                    const isExpanded = expandedComments.has(key);
                    const EMOJIS = ["❤️", "🔥", "💪", "🙌"];

                    return (
                      <div
                        key={i}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: "var(--sidebar)", border: "1px solid var(--border)" }}
                      >
                        {/* Update body */}
                        <div className="px-4 pt-4 pb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{u.firstName}</span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{dateLabel}</span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                            <span className="text-[10px] uppercase tracking-wide font-semibold mr-1.5" style={{ color: "var(--muted-foreground)" }}>Today</span>{u.today}
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                            <span className="text-[10px] uppercase tracking-wide font-semibold mr-1.5" style={{ color: "var(--muted-foreground)" }}>Tomorrow</span>{u.tomorrow}
                          </p>
                          {u.blockers && (
                            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.55 0.15 50)" }}>
                              <span className="text-[10px] uppercase tracking-wide font-semibold mr-1.5">Blocker</span>{u.blockers}
                            </p>
                          )}
                        </div>

                        {/* Reactions + Reply bar */}
                        <div className="flex items-center gap-1 px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                          {EMOJIS.map(emoji => {
                            const count = cardReactions.filter(r => r.emoji === emoji).length;
                            const iMine = cardReactions.some(r => r.emoji === emoji && r.reactor_user_id === userId);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction(u.user_id, u.date, emoji)}
                                className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] transition-all"
                                style={{
                                  background: iMine ? "oklch(0.91 0.07 145 / 0.25)" : "transparent",
                                  border: iMine ? "1px solid oklch(0.55 0.13 145 / 0.3)" : "1px solid transparent",
                                  color: "var(--foreground)",
                                }}
                              >
                                {emoji}{count > 0 && <span className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>{count}</span>}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setExpandedComments(prev => {
                              const next = new Set(prev);
                              next.has(key) ? next.delete(key) : next.add(key);
                              return next;
                            })}
                            className="ml-auto text-[11px] font-medium px-2 py-1 rounded-full transition-colors"
                            style={{ color: isExpanded ? "var(--primary)" : "var(--muted-foreground)" }}
                          >
                            {isExpanded ? "Hide" : `Reply${cardComments.length > 0 ? ` (${cardComments.length})` : ""}`}
                          </button>
                        </div>

                        {/* Comments section */}
                        {isExpanded && (
                          <div className="px-4 pb-3 pt-2 border-t space-y-3" style={{ borderColor: "var(--border)", background: theme === "dark" ? "oklch(0.18 0.02 65 / 0.5)" : "oklch(0.97 0.01 85)" }}>
                            {cardComments.length > 0 && (
                              <div className="space-y-2">
                                {cardComments.map(c => (
                                  <div key={c.id} className="flex gap-2">
                                    <span className="text-xs font-semibold shrink-0 mt-0.5" style={{ color: "var(--primary)" }}>{c.commenter_name}</span>
                                    <span className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{c.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a reply…"
                                value={commentDrafts[key] ?? ""}
                                onChange={e => setCommentDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(u.user_id, u.date); } }}
                                className="flex-1 text-xs px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2"
                                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                              />
                              <button
                                type="button"
                                disabled={!commentDrafts[key]?.trim() || submittingComment === key}
                                onClick={() => submitComment(u.user_id, u.date)}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-opacity disabled:opacity-40"
                                style={{ background: "var(--primary)" }}
                              >
                                {submittingComment === key ? "…" : "Send"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                        })}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-3 pt-2 pb-4">
                            <button
                              type="button"
                              disabled={communityPage === 0}
                              onClick={() => setCommunityPage(p => p - 1)}
                              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity disabled:opacity-30"
                              style={{ background: "var(--sidebar)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                            >
                              ← Prev
                            </button>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              Page {communityPage + 1} of {totalPages}
                            </span>
                            <button
                              type="button"
                              disabled={communityPage >= totalPages - 1}
                              onClick={() => setCommunityPage(p => p + 1)}
                              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity disabled:opacity-30"
                              style={{ background: "var(--sidebar)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <BotanicalGarden
              rootsActive={rootsActive}
              sproutActive={sproutActive}
              stemActive={stemActive}
              flowerActive={flowerActive}
              exoticActive={exoticActive}
              isDark={theme === "dark"}
              bloomBurst={bloomBurst}
            />
          )}
        </div>
      </main>

      {/* Submission gate modal */}
      {submissionModal && (
        <SubmissionModal
          open={true}
          subtaskLabel={submissionModal.sub.label}
          gate={submissionModal.sub.gate!}
          existing={submissions[submissionModal.sub.id]}
          onSubmit={handleSubmissionConfirm}
          onClose={() => setSubmissionModal(null)}
        />
      )}

      {/* Learning content modal */}
      {contentModal && (
        <ContentModal
          title={contentModal.title}
          content={contentModal.content}
          onClose={() => setContentModal(null)}
          gate={contentModal.gate}
          subId={contentModal.subId}
          existing={contentModal.sub ? submissions[contentModal.sub.id] : undefined}
          onSubmit={contentModal.gate && contentModal.step && contentModal.sub
            ? (data) => confirmSubmission(contentModal.step!, contentModal.sub!, data)
            : undefined}
        />
      )}

      {/* Daily update modal */}
      {showUpdateModal && userId && (
        <DailyUpdateModal
          userId={userId}
          displayName={displayName}
          existing={todayUpdate}
          onClose={() => setShowUpdateModal(false)}
          onSubmitted={(update) => setTodayUpdate(update)}
        />
      )}

      {/* Welcome modal for new users */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
          >
            <div className="flex-1 overflow-y-auto px-7 py-8 space-y-4">
              <div className="text-4xl text-center">🚀</div>
              <h2 className="font-serif text-xl font-bold text-center" style={{ color: "var(--foreground)" }}>
                Buckle up - this is going to be an exciting ride!
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                <p>Hi there - we're so happy you're here!</p>
                <p>You are about to embark on an exciting, yet not so easy journey. In this chapter, we will learn all about JavaScript and basic coding concepts. This is the foundation of coding and therefore really important.</p>
                <p>It might seem intimidating at first, but we know you can do it. And we're along for the ride, right there with you! 🌸</p>
                <p className="font-semibold">A few notes on the curriculum:</p>
                <p>Throughout the curriculum, you will find some recurring elements, like:</p>
                <ul className="space-y-1.5 pl-4 list-disc" style={{ color: "var(--foreground)" }}>
                  <li>Marked in green, you will find examples of the theory explained beforehand</li>
                  <li>Marked in blue, you will find some deep-dive questions for you to work on. These questions are optional, but we recommend that you work through them as well. Think about the problem/question proposed and note down your answer. These deep dives will be discussed in your mentor hours.</li>
                  <li>Exercises: This is where you take action. Put the learned theory into practice and solve these exercises (mandatory).</li>
                  <li>Video resources: These are optional.</li>
                </ul>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
                  Please note: If you come across something in the curriculum that is unclear, if you find a mistake or have ideas for improvements, please post your feedback in the #curriculum channel on Slack. We are always happy to hear your constructive feedback and to improve our program with you. Thank you! 🤗
                </p>
                <p>What you will learn in this curriculum will kickstart your tech journey and is the first step to an exciting future. So, keep the goal in mind and have fun while you're learning.</p>
                <p>And remember, you're not alone. You are now part of an incredible community of motivated learners. We can't wait to witness your journey, and we are rooting for you.</p>
                <p className="font-semibold">So now, without further ado - let the learning begin! 🚀</p>
              </div>
            </div>
            <div className="shrink-0 px-7 pb-7">
              <button
                type="button"
                onClick={() => { setShowWelcomeModal(false); setOnboarded(); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--leaf))" }}
              >
                Let's go! 🌱
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum completion modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCompleteModal(false)} />
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
          >
            <div className="px-7 py-8 space-y-4 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>
                You've made it!
              </h2>
              <div className="space-y-3 text-sm text-left leading-relaxed" style={{ color: "var(--foreground)" }}>
                <p>Wowza - that was a lot! 🥹</p>
                <p>But you know what? You've just made it through one of the toughest parts of learning software development. How do you feel? Are you proud of yourself?</p>
                <p>We sure know that we are! Not everybody makes it through Javascript and these coding concepts because it's really not easy.</p>
                <p>So if you're here - it's time to give yourself a pat on the back and appreciate this moment.</p>
                <p>Look back at everything you've learned and where you started: You've come <strong>so</strong> far! And now, the sky is the limit. Keep going and we know your future will be bright bright bright! 🔮</p>
                <p>We cannot wait to see all the great things you will do and we are so proud of you!</p>
                <p className="font-semibold">Congratulations! 🥳</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Warmly,<br />Your Code Blossom Team 🌸
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--leaf))" }}
              >
                Thank you! 🌸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
