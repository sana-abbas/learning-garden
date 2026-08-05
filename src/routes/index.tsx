import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Lock,
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
import { type MilestoneVariant } from "@/components/garden/MilestoneModal";
import { SubmissionModal } from "@/components/garden/SubmissionModal";
import { CallClaimModal } from "@/components/garden/CallClaimModal";
import { DailyUpdateModal } from "@/components/garden/DailyUpdateModal";
import { OnboardingScreen, ONBOARDING_OPTIONS } from "@/components/garden/OnboardingScreen";
import { STEPS, CURRICULUM_STEPS } from "@/data/curriculum";
import type { Step } from "@/data/curriculum";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    garden: search.garden === "1" || search.garden === true || search.garden === "true",
  }),
  component: Index,
});

// ── helpers ──────────────────────────────────────────────────────────────────

function parseWeeks(duration: string): number {
  if (/week/i.test(duration)) {
    const m = duration.match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }
  if (/month/i.test(duration)) {
    const m = duration.match(/(\d+)[–-]?(\d+)?/);
    if (m) {
      const lo = parseInt(m[1]);
      const hi = m[2] ? parseInt(m[2]) : lo;
      return Math.round(((lo + hi) / 2) * 4);
    }
  }
  return 0;
}

function fireConfetti() {
  confetti({
    particleCount: 90,
    spread: 65,
    origin: { y: 0.45, x: 0.25 },
    colors: ["#4ade80", "#86efac", "#f472b6", "#a78bfa", "#fbbf24", "#34d399"],
  });
}

// ── Motivational quotes (shown on subtask check) ──────────────────────────────

const QUOTES = [
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Code is like humour. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Any fool can write code a computer understands. Good programmers write code humans understand.", author: "Martin Fowler" },
  { text: "Progress, not perfection.", author: null },
  { text: "Small steps every day add up to big leaps.", author: null },
  { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: null },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "The more I learn, the more I realise how much I don't know.", author: "Albert Einstein" },
  { text: "One of my most productive days was throwing away 1,000 lines of code.", author: "Ken Thompson" },
  { text: "Learning to code is learning to think.", author: "Steve Jobs" },
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Consistency beats intensity every time.", author: null },
  { text: "Future you is going to thank present you.", author: null },
  { text: "You are literally rewiring your brain right now.", author: null },
  { text: "Every checkbox is a seed planted. 🌱", author: null },
  { text: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" },
  { text: "Good judgment comes from experience, and experience comes from bad judgment.", author: null },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Sometimes the best code is no code at all.", author: null },
];

// ── Chapter completion facts (cited from Stack Overflow / W3Techs surveys) ───

const CHAPTER_FACTS: Record<string, { stat: string; source: string }> = {
  ch1: {
    stat: "Over 5.4 billion people use the internet every day and you now understand the protocol behind every single request they make.",
    source: "Statista Global Internet Report 2024",
  },
  ch2: {
    stat: "JavaScript has been the most-used programming language for 11 consecutive years. You're now speaking the language of the web.",
    source: "Stack Overflow Developer Survey 2023",
  },
  ch3: {
    stat: "52.9% of all developers use HTML/CSS daily. You've just joined the majority of the dev world.",
    source: "Stack Overflow Developer Survey 2023",
  },
  ch4: {
    stat: "93.9% of developers use Git for version control. You're now part of the professional standard.",
    source: "Stack Overflow Developer Survey 2023",
  },
  paid1: {
    stat: "Developers with a portfolio on GitHub are significantly more likely to receive interview callbacks. Yours is live.",
    source: "LinkedIn Talent Insights 2023",
  },
  ch5: {
    stat: "Bootstrap powers over 19% of all websites — hundreds of millions of pages you can now build from scratch.",
    source: "W3Techs Web Technology Surveys 2024",
  },
  ch6: {
    stat: "TypeScript adoption grew from 12% to 43% of developers in just 5 years. You're ahead of the curve.",
    source: "Stack Overflow Developer Survey 2018 vs 2023",
  },
  ch7: {
    stat: "PostgreSQL is the world's most popular database, trusted by Apple, Instagram and Spotify. You now know how it works.",
    source: "Stack Overflow Developer Survey 2023",
  },
  ch8: {
    stat: "React is used by 40.6% of all developers and powers Netflix, Airbnb, Discord, and more. You're in good company.",
    source: "Stack Overflow Developer Survey 2023",
  },
  ch9: {
    stat: "Node.js is used by 42.7% of developers worldwide. You can now build the full stack — front to back.",
    source: "Stack Overflow Developer Survey 2023",
  },
  paid2: {
    stat: "Fewer than 10% of self-taught developers ship a complete, deployed full-stack app. You are now one of them.",
    source: "Stack Overflow Developer Survey 2023 (industry estimate)",
  },
};

function showRandomQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  toast(q.text, {
    description: q.author ? `(${q.author})` : undefined,
    icon: "🌱",
    duration: 4000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

function Index() {
  const navigate = useNavigate();
  const { garden } = Route.useSearch();
  const { theme, toggle: toggleTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [todayUpdate, setTodayUpdate] = useState<{ today: string; tomorrow: string; blockers: string | null } | null | undefined>(undefined);
  const [openId, setOpenId] = useState<string | null>(null);
  // Submission gate modal (assignment subtasks)
  const [submissionModal, setSubmissionModal] = useState<{
    step: Step;
    sub: SubTask;
  } | null>(null);
  // Founders call claim modal
  const [callClaimModal, setCallClaimModal] = useState<MilestoneVariant | null>(null);
  // Keep a ref to which call step triggered the modal so we can check it on confirm
  const pendingCallStep = useRef<Step | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    checked, setChecked, notes, setNotes,
    submissions, setSubmission,
    streak, bumpStreak, syncing, saveNow,
    onboarded, progressReady, setOnboarded,
  } = useProgress(userId);

  // Tracks which chapter note just saved (for ✓ button feedback)
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const savedNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSaveNote = async (stepId: string) => {
    await saveNow();
    if (savedNoteTimer.current) clearTimeout(savedNoteTimer.current);
    setSavedNoteId(stepId);
    savedNoteTimer.current = setTimeout(() => setSavedNoteId(null), 2000);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"curriculum" | "community">("curriculum");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [todayDateLabel, setTodayDateLabel] = useState<string | null>(null);
  useEffect(() => { setTodayDateLabel(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })); }, []);
  const [bloomBurst, setBloomBurst] = useState(false);

  type FsCommunityMember = { user_id: string; firstName: string };
  type FsCommunityUpdate = { user_id: string; firstName: string; date: string; today: string; tomorrow: string; blockers: string | null };
  type FsReaction = { update_user_id: string; update_date: string; reactor_user_id: string; emoji: string };
  type FsComment = { id: string; update_user_id: string; update_date: string; commenter_user_id: string; commenter_name: string; text: string; created_at: string };
  const [fsMembers, setFsMembers] = useState<FsCommunityMember[] | null>(null);
  const [fsUpdates, setFsUpdates] = useState<FsCommunityUpdate[] | null>(null);
  const [fsLoading, setFsLoading] = useState(false);
  const [fsReactions, setFsReactions] = useState<FsReaction[]>([]);
  const [fsComments, setFsComments] = useState<FsComment[]>([]);
  const [fsExpandedComments, setFsExpandedComments] = useState<Set<string>>(new Set());
  const [fsCommentDrafts, setFsCommentDrafts] = useState<Record<string, string>>({});
  const [fsSubmittingComment, setFsSubmittingComment] = useState<string | null>(null);
  const [fsFilterDate, setFsFilterDate] = useState<string>("");
  const [fsPage, setFsPage] = useState(0);
  const FS_PAGE_SIZE = 10;
  const prevCompletionRef = useRef<Record<string, boolean>>({});
  // Suppress bloom burst when onboarding pre-checks many chapters at once
  const skipNextBloom = useRef(false);
  // Tracks the userId for which the bloom ref has been initialized
  // Reset whenever a new user's progress loads so we don't fire on login
  const bloomInitializedFor = useRef<string | null>(null);

  // Auth guard — redirect to /login if not signed in, /mentor if mentor role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        const { data: mentorRow } = await supabase.from("mentors").select("id").eq("user_id", session.user.id).maybeSingle();
        if (mentorRow && !garden) { navigate({ to: "/mentor" }); return; }
        if (!mentorRow) {
          // Check existing cohort assignment first
          const { data: member } = await supabase
            .from("cohort_members")
            .select("cohort_id, cohorts(slug)")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const existingSlug = (member as any)?.cohorts?.slug;
          if (existingSlug === "coding-fundamentals") { navigate({ to: "/cf" }); return; }
          // New student — check invite list by email
          if (!member && session.user.email) {
            const { data: invite } = await supabase
              .from("cohort_invites")
              .select("cohort_id, cohorts(slug)")
              .eq("email", session.user.email.toLowerCase())
              .maybeSingle();
            if (invite && (invite as any)?.cohorts?.slug === "coding-fundamentals") {
              await supabase.from("cohort_members").insert({ user_id: session.user.id, cohort_id: (invite as any).cohort_id });
              navigate({ to: "/cf" });
              return;
            }
          }
        }
        // Not a CF student — stay on / (full-stack, default)
        // Save display_name and email so the mentor dashboard can read them
        const name = (session.user.user_metadata?.full_name as string | undefined) ?? session.user.email?.split("@")[0] ?? "Gardener";
        const avatarUrl = (session.user.user_metadata?.avatar_url as string | undefined) ?? null;
        supabase.from("user_progress").upsert(
          { user_id: session.user.id, display_name: name, email: session.user.email, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        ).then(() => {});
        setUserId(session.user.id);
        setUser(session.user);
        setAuthReady(true);

        const dateStr = new Date().toISOString().split("T")[0];
        supabase.from("daily_updates").select("today, tomorrow, blockers")
          .eq("user_id", session.user.id).eq("date", dateStr).maybeSingle()
          .then(({ data }) => setTodayUpdate(data ?? null));
      }
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
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      if (savedNoteTimer.current) clearTimeout(savedNoteTimer.current);
    };
  }, []);

  const completion = useMemo(() => {
    const map: Record<string, boolean> = {};
    STEPS.forEach((s) => {
      if (s.subtasks && s.subtasks.length > 0) {
        map[s.id] = s.subtasks.every((sub) => checked[sub.id]);
      } else {
        map[s.id] = !!checked[s.id];
      }
    });
    return map;
  }, [checked]);

  const weeksRemaining = useMemo(
    () => STEPS.filter((s) => !completion[s.id]).reduce((acc, s) => acc + parseWeeks(s.duration), 0),
    [completion],
  );

  // Which founders calls are still locked (prerequisites not all complete)
  const lockedCalls = useMemo(() => {
    const map: Record<string, boolean> = {};
    STEPS.forEach((s) => {
      if (s.kind === "call" && s.prerequisites) {
        map[s.id] = !s.prerequisites.every((p) => completion[p]);
      }
    });
    return map;
  }, [completion]);

  // Detect newly completed chapters → show fact toast + bloom burst
  useEffect(() => {
    const prev = prevCompletionRef.current;
    prevCompletionRef.current = { ...completion };

    // On first load (or when a different user's data loads), silently sync
    // the ref so existing completions don't appear as "newly completed"
    if (bloomInitializedFor.current !== userId) {
      if (progressReady) {
        prevCompletionRef.current = { ...completion };
        bloomInitializedFor.current = userId;
      }
      return;
    }

    // Suppress during onboarding pre-check
    if (skipNextBloom.current) {
      skipNextBloom.current = false;
      return;
    }

    const justCompleted = STEPS.filter(
      (s) => completion[s.id] && !prev[s.id],
    );
    if (justCompleted.length > 0) {
      const fact = CHAPTER_FACTS[justCompleted[0].id];
      if (fact) {
        toast(fact.stat, {
          description: `(${fact.source})`,
          icon: "📊",
          duration: 7000,
        });
      }
      setBloomBurst(true);
      const t = setTimeout(() => setBloomBurst(false), 3200);
      return () => clearTimeout(t);
    }
  }, [completion, progressReady]);

  // Bump streak on app open — just showing up each day keeps the streak alive
  useEffect(() => {
    if (progressReady && userId) {
      bumpStreak();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressReady, userId]);

  const toggleStep = (step: Step) => {
    // Steps with subtasks: toggling the parent checkbox bulk-checks/unchecks all subtasks
    if (step.subtasks && step.subtasks.length > 0) {
      const allDone = step.subtasks.every((s) => checked[s.id]);

      // When checking (not unchecking): block on the first gated subtask missing a submission
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
      if (!allDone && step.kind === "module") setTimeout(fireConfetti, 300);
      if (!allDone) bumpStreak();
      return;
    }

    // Founders call — once claimed it stays claimed; can't be unchecked
    if (step.kind === "call") {
      if (checked[step.id]) return; // already claimed — lock it permanently
      if (lockedCalls[step.id]) return; // prerequisites not done
      pendingCallStep.current = step;
      setCallClaimModal(step.callVariant!);
      return;
    }

    // Regular module step (no subtasks) or unchecking a call
    setChecked((prev) => {
      const wasChecked = !!prev[step.id];
      if (!wasChecked && step.kind === "module") setTimeout(fireConfetti, 300);
      return { ...prev, [step.id]: !wasChecked };
    });
    if (!checked[step.id]) bumpStreak();
  };

  const toggleSubtask = (step: Step, sub: SubTask) => {
    const subId = sub.id;
    // Unchecking — always allowed
    if (checked[subId]) {
      setChecked((prev) => ({ ...prev, [subId]: false }));
      return;
    }
    // Checking a gated subtask — open submission modal
    if (sub.gate) {
      setSubmissionModal({ step, sub });
      return;
    }
    // No gate — check directly
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

  const handleSubmissionConfirm = async (data: { link?: string; video?: string }) => {
    if (!submissionModal) return;
    const { step, sub } = submissionModal;
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
    setSubmissionModal(null);
  };

  const handleCallClaim = async () => {
    const step = pendingCallStep.current;
    if (!step) return;
    // Mark the call as checked
    setChecked((prev) => ({ ...prev, [step.id]: true }));
    setSubmission(step.id, { claimedAt: new Date().toISOString() });
    bumpStreak();
    // Fire email notification via Supabase edge function (fails silently if not deployed)
    try {
      await supabase.functions.invoke("notify-call-claim", {
        body: {
          callName: step.title,
          callVariant: step.callVariant,
          userName: (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "A participant",
          userEmail: user?.email ?? "",
        },
      });
    } catch {
      // Edge function not deployed yet — that's fine, claim is still stored
    }
  };

  const handleOnboardingConfirm = async (startingStepId: string) => {
    // Pre-check all subtasks/steps that come BEFORE the selected starting step
    const preChecked: Record<string, boolean> = {};
    for (const step of STEPS) {
      if (step.id === startingStepId) break;
      if (step.subtasks && step.subtasks.length > 0) {
        step.subtasks.forEach((sub) => { preChecked[sub.id] = true; });
      } else {
        preChecked[step.id] = true;
      }
    }
    // Don't fire bloom/quotes for this bulk pre-check
    skipNextBloom.current = true;
    setChecked(preChecked);
    await setOnboarded();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange listener above will navigate to /login
  };

  // Show spinner while checking auth or loading progress
  if (!authReady || !progressReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="w-6 h-6 rounded-full border-2 border-[color:var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Progress counts only curriculum steps (modules + paid projects), not founders calls
const completedCount = CURRICULUM_STEPS.filter((s) => completion[s.id]).length;
  const progress = (completedCount / CURRICULUM_STEPS.length) * 100;
  const allDone = completedCount === CURRICULUM_STEPS.length;

  // User profile derived values
  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "Gardener";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const lastActive = user ? todayDateLabel : null;

  const rootsActive = completion["ch1"] || completion["ch2"];
  const sproutActive = completion["ch2"] && completion["ch3"];
  const stemActive = completion["ch4"] && completion["paid1"];
  const flowerActive =
    completion["ch5"] && completion["ch6"] && completion["ch7"] && completion["ch8"];
  const exoticActive = completion["ch9"] && completion["paid2"];

  const loadFsCommunity = async () => {
    if (fsMembers !== null || fsLoading) return;
    setFsLoading(true);
    const { data: cohortRow } = await supabase.from("cohorts").select("id").eq("slug", "full-stack").maybeSingle();
    if (!cohortRow) { setFsMembers([]); setFsLoading(false); return; }
    const { data: memberRows } = await supabase.from("cohort_members").select("user_id").eq("cohort_id", (cohortRow as any).id);
    const fsUserIds = (memberRows ?? []).map((r: any) => r.user_id as string);
    if (fsUserIds.length === 0) { setFsMembers([]); setFsLoading(false); return; }
    const { data: progressRows } = await supabase.from("user_progress").select("user_id, display_name, email").in("user_id", fsUserIds);
    const nameMap = Object.fromEntries((progressRows ?? []).map((p: any) => [p.user_id, (p.display_name?.split(" ")[0] || p.email?.split("@")[0] || "Someone")]));
    const members: FsCommunityMember[] = fsUserIds.map(id => ({ user_id: id, firstName: nameMap[id] || "Someone" }));
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];
    const { data: updateRows } = await supabase.from("daily_updates").select("user_id, date, today, tomorrow, blockers, display_name").in("user_id", fsUserIds).gte("date", cutoff).order("date", { ascending: false }).limit(50);
    const updates: FsCommunityUpdate[] = (updateRows ?? []).map((u: any) => ({ ...u, firstName: u.display_name?.split(" ")[0] || nameMap[u.user_id] || "Someone" }));
    const { data: reactionRows } = await supabase.from("update_reactions").select("update_user_id, update_date, reactor_user_id, emoji").in("update_user_id", fsUserIds).gte("update_date", cutoff);
    const { data: commentRows } = await supabase.from("update_comments").select("id, update_user_id, update_date, commenter_user_id, commenter_name, text, created_at").in("update_user_id", fsUserIds).gte("update_date", cutoff).order("created_at", { ascending: true });
    setFsMembers(members);
    setFsUpdates(updates);
    setFsReactions((reactionRows ?? []) as FsReaction[]);
    setFsComments((commentRows ?? []) as FsComment[]);
    setFsLoading(false);
  };

  const toggleFsReaction = async (updateUserId: string, updateDate: string, emoji: string) => {
    if (!userId) return;
    const isReacted = fsReactions.some(r => r.update_user_id === updateUserId && r.update_date === updateDate && r.emoji === emoji && r.reactor_user_id === userId);
    if (isReacted) {
      setFsReactions(prev => prev.filter(r => !(r.update_user_id === updateUserId && r.update_date === updateDate && r.emoji === emoji && r.reactor_user_id === userId)));
      await supabase.from("update_reactions").delete().eq("update_user_id", updateUserId).eq("update_date", updateDate).eq("reactor_user_id", userId).eq("emoji", emoji);
    } else {
      setFsReactions(prev => [...prev, { update_user_id: updateUserId, update_date: updateDate, reactor_user_id: userId, emoji }]);
      await supabase.from("update_reactions").insert({ update_user_id: updateUserId, update_date: updateDate, reactor_user_id: userId, emoji });
    }
  };

  const submitFsComment = async (updateUserId: string, updateDate: string) => {
    const key = `${updateUserId}_${updateDate}`;
    const text = fsCommentDrafts[key]?.trim();
    if (!text || !userId) return;
    setFsSubmittingComment(key);
    const firstName = displayName.split(" ")[0] || "Gardener";
    const { data, error } = await supabase.from("update_comments").insert({ update_user_id: updateUserId, update_date: updateDate, commenter_user_id: userId, commenter_name: firstName, text }).select().single();
    if (!error && data) {
      setFsComments(prev => [...prev, data as FsComment]);
      setFsCommentDrafts(prev => ({ ...prev, [key]: "" }));
    }
    setFsSubmittingComment(null);
  };

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--background)] flex flex-col lg:flex-row">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
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
                Full-Stack Curriculum
              </p>
            </div>
            {/* Close button — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[color:var(--muted-foreground)] hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)]"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Back to dashboard button — mentor garden preview only */}
          {garden && (
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
                Curriculum
              </span>
              <span className="text-xs font-mono text-[color:var(--muted-foreground)]">
                {completedCount}/{CURRICULUM_STEPS.length}
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
            {weeksRemaining > 0 && (
              <p className="text-[10px] text-[color:var(--muted-foreground)] mt-1.5 text-right">
                ~{weeksRemaining} weeks remaining
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {STEPS.map((step, i) => {
            const isChecked = completion[step.id];
            const Icon = step.icon;
            const isCall = step.kind === "call";
            const isPaid = step.kind === "paid";
            const isLocked = isCall && !!lockedCalls[step.id];
            const hasSubs = !!(step.subtasks && step.subtasks.length);
            const isOpen = openId === step.id;
            const subDone = hasSubs
              ? step.subtasks!.filter((s) => checked[s.id]).length
              : 0;
            // Human-readable hint for locked calls
            const lockHint = isLocked && step.prerequisites
              ? `Complete ${step.prerequisites
                  .filter((p) => !completion[p])
                  .map((p) => STEPS.find((s) => s.id === p)?.title ?? p)
                  .join(", ")} to unlock`
              : null;

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
                  {isCall && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[color:var(--bloom-pink)]/15 text-[color:var(--bloom-magenta)] shrink-0">
                      Call
                    </span>
                  )}
                  {isPaid && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[color:var(--primary)]/15 text-[color:var(--primary)] shrink-0">
                      Paid
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5 truncate">
                  {isCall
                    ? step.subtitle
                    : `${step.subtitle} · ${step.duration}${
                        hasSubs ? ` · ${subDone}/${step.subtasks!.length}` : ""
                      }`}
                </div>
                {lockHint && (
                  <div className="text-[10px] text-[color:var(--muted-foreground)]/70 mt-0.5 truncate">
                    🔒 {lockHint}
                  </div>
                )}
              </>
            );

            return (
              <div
                key={step.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isLocked
                    ? "border-dashed border-[color:var(--muted-foreground)]/20 opacity-60"
                    : isChecked
                      ? isCall
                        ? "bg-[color:var(--sidebar-accent)] border-[color:var(--bloom-pink)]/40 shadow-sm"
                        : "bg-[color:var(--sidebar-accent)] border-[color:var(--primary)]/30 shadow-sm"
                      : isCall
                        ? "border-dashed border-[color:var(--bloom-pink)]/30 bg-[oklch(0.97_0.025_340)]/40 dark:bg-[oklch(0.22_0.04_340)]/20"
                        : "border-transparent hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] hover:border-[color:var(--sidebar-border)]"
                }`}
              >
                <div className="group flex items-center gap-3.5 p-3.5">
                  {isLocked ? (
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5 text-[color:var(--muted-foreground)]" />
                    </div>
                  ) : (
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleStep(step)}
                    disabled={isCall && isChecked}
                    className="w-5 h-5 rounded-md border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)] disabled:opacity-100 disabled:cursor-default"
                  />
                  )}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isChecked ? "scale-105" : "opacity-70"
                    }`}
                    style={{
                      background: isChecked
                        ? isCall
                          ? "linear-gradient(135deg, var(--bloom-pink), var(--bloom-magenta))"
                          : isPaid
                            ? "linear-gradient(135deg, var(--bloom-pink), var(--primary))"
                            : "linear-gradient(135deg, var(--primary), var(--leaf-light))"
                        : isCall
                          ? theme === "dark" ? "oklch(0.25 0.06 340)" : "oklch(0.94 0.04 340)"
                          : theme === "dark" ? "oklch(0.24 0.03 65)" : "oklch(0.9 0.03 85)",
                      color: isChecked
                        ? "white"
                        : isCall
                          ? "var(--bloom-magenta)"
                          : "var(--muted-foreground)",
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
                    !isCall && (
                      <span className="text-[10px] font-mono text-[color:var(--muted-foreground)]/70 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )
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
                                {sub.url && !subChecked ? (
                                  <a
                                    href={sub.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[12.5px] leading-snug underline underline-offset-2 decoration-[color:var(--primary)]/40 hover:decoration-[color:var(--primary)] transition-all text-[color:var(--sidebar-foreground)]"
                                  >
                                    {sub.label}
                                  </a>
                                ) : (
                                  <span
                                    className={`text-[12.5px] leading-snug transition-all ${
                                      subChecked
                                        ? "text-[color:var(--muted-foreground)] line-through decoration-[color:var(--primary)]/50"
                                        : "text-[color:var(--sidebar-foreground)]"
                                    }`}
                                  >
                                    {sub.label}
                                  </span>
                                )}
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

        {/* ── Top bar ─────────────────────────────────────────────── */}
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

          {/* Tagline + garden state caption */}
          <div className="flex-1 min-w-0">
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

          {/* Tab toggle — desktop only */}
          <div className="hidden lg:flex shrink-0 rounded-xl overflow-hidden border border-[color:var(--border)]" style={{ background: "var(--sidebar)" }}>
            {(["curriculum", "community"] as const).map((tab) => (
              <button key={tab} type="button"
                onClick={() => { setSidebarTab(tab); if (tab === "community") loadFsCommunity(); }}
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

          {/* Right: controls + profile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {syncing && (
              <span title="Syncing…">
                <RefreshCw className="w-3.5 h-3.5 text-[color:var(--muted-foreground)] animate-spin" />
              </span>
            )}

            {/* Streak — icon + number only */}
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

            {/* Daily update — icon only */}
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

        {/* ── Main content — Garden or Community ──────────────────── */}
        <div className="flex-1 min-h-0">
          {sidebarTab === "community" ? (
            <div className="h-full overflow-y-auto p-6">
              {fsLoading ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted-foreground)" }}>Loading community…</div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Filter toolbar */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "var(--sidebar)", border: "1px solid var(--border)" }}>
                      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Date</span>
                      <input
                        type="date"
                        value={fsFilterDate}
                        onChange={e => { setFsFilterDate(e.target.value); setFsPage(0); }}
                        className="text-xs bg-transparent focus:outline-none"
                        style={{ color: fsFilterDate ? "var(--foreground)" : "var(--muted-foreground)" }}
                      />
                    </div>
                    {fsFilterDate && (
                      <button type="button" onClick={() => { setFsFilterDate(""); setFsPage(0); }}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-xl"
                        style={{ background: "var(--sidebar)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                        Clear filter
                      </button>
                    )}
                    <span className="ml-auto text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {(() => { const n = (fsUpdates ?? []).filter(u => !fsFilterDate || u.date === fsFilterDate).length; return `${n} update${n !== 1 ? "s" : ""}`; })()}
                    </span>
                  </div>

                  {(() => {
                    const filtered = (fsUpdates ?? []).filter(u => !fsFilterDate || u.date === fsFilterDate);
                    const totalPages = Math.ceil(filtered.length / FS_PAGE_SIZE);
                    const paged = filtered.slice(fsPage * FS_PAGE_SIZE, (fsPage + 1) * FS_PAGE_SIZE);
                    const EMOJIS = ["❤️", "🔥", "💪", "🙌"];
                    return (
                      <>
                        {filtered.length === 0 && (
                          <p className="text-sm text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                            {fsFilterDate ? "No updates for this date." : "No updates in the last 7 days."}
                          </p>
                        )}
                        {paged.map((u, i) => {
                          const [y, mo, d] = u.date.split("-").map(Number);
                          const dateLabel = new Date(y, mo - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                          const key = `${u.user_id}_${u.date}`;
                          const cardReactions = fsReactions.filter(r => r.update_user_id === u.user_id && r.update_date === u.date);
                          const cardComments = fsComments.filter(c => c.update_user_id === u.user_id && c.update_date === u.date);
                          const isExpanded = fsExpandedComments.has(key);
                          return (
                            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "var(--sidebar)", border: "1px solid var(--border)" }}>
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
                              <div className="flex items-center gap-1 px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                                {EMOJIS.map(emoji => {
                                  const count = cardReactions.filter(r => r.emoji === emoji).length;
                                  const iMine = cardReactions.some(r => r.emoji === emoji && r.reactor_user_id === userId);
                                  return (
                                    <button key={emoji} type="button"
                                      onClick={() => toggleFsReaction(u.user_id, u.date, emoji)}
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
                                <button type="button"
                                  onClick={() => setFsExpandedComments(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; })}
                                  className="ml-auto text-[11px] font-medium px-2 py-1 rounded-full transition-colors"
                                  style={{ color: isExpanded ? "var(--primary)" : "var(--muted-foreground)" }}
                                >
                                  {isExpanded ? "Hide" : `Reply${cardComments.length > 0 ? ` (${cardComments.length})` : ""}`}
                                </button>
                              </div>
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
                                    <input type="text" placeholder="Write a reply…"
                                      value={fsCommentDrafts[key] ?? ""}
                                      onChange={e => setFsCommentDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitFsComment(u.user_id, u.date); } }}
                                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2"
                                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                                    />
                                    <button type="button"
                                      disabled={!fsCommentDrafts[key]?.trim() || fsSubmittingComment === key}
                                      onClick={() => submitFsComment(u.user_id, u.date)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-opacity disabled:opacity-40"
                                      style={{ background: "var(--primary)" }}
                                    >
                                      {fsSubmittingComment === key ? "…" : "Send"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-3 pt-2 pb-4">
                            <button type="button" disabled={fsPage === 0} onClick={() => setFsPage(p => p - 1)}
                              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity disabled:opacity-30"
                              style={{ background: "var(--sidebar)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                              ← Prev
                            </button>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Page {fsPage + 1} of {totalPages}</span>
                            <button type="button" disabled={fsPage >= totalPages - 1} onClick={() => setFsPage(p => p + 1)}
                              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity disabled:opacity-30"
                              style={{ background: "var(--sidebar)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
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

      {/* First-login onboarding overlay */}
      {!onboarded && progressReady && (
        <OnboardingScreen
          userName={displayName}
          onConfirm={handleOnboardingConfirm}
        />
      )}

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

      {/* Founders call claim modal */}
      {callClaimModal && (
        <CallClaimModal
          open={true}
          variant={callClaimModal}
          onClaim={handleCallClaim}
          onClose={() => {
            setCallClaimModal(null);
            pendingCallStep.current = null;
          }}
        />
      )}

      {/* Daily update modal */}
      {showUpdateModal && userId && (
        <DailyUpdateModal
          userId={userId}
          existing={todayUpdate}
          onClose={() => setShowUpdateModal(false)}
          onSubmitted={(update) => setTodayUpdate(update)}
        />
      )}
    </div>
  );
}
