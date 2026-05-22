import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Leaf,
  Code2,
  Layers,
  Briefcase,
  Sprout,
  Trophy,
  Globe,
  GitBranch,
  LayoutTemplate,
  FileType2,
  Database,
  Atom,
  Server,
  PhoneCall,
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useProgress } from "@/hooks/useProgress";
import confetti from "canvas-confetti";
import { BotanicalGarden } from "@/components/garden/BotanicalGarden";
import { type MilestoneVariant } from "@/components/garden/MilestoneModal";
import { SubmissionModal, type SubmissionGate } from "@/components/garden/SubmissionModal";
import { CallClaimModal } from "@/components/garden/CallClaimModal";
import { OnboardingScreen, ONBOARDING_OPTIONS } from "@/components/garden/OnboardingScreen";

export const Route = createFileRoute("/")({
  component: Index,
});

type StepKind = "module" | "paid" | "call";

interface SubTask {
  id: string;
  label: string;
  gate?: SubmissionGate;
}

interface Step {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: StepKind;
  callVariant?: MilestoneVariant;
  prerequisites?: string[];
  subtasks?: SubTask[];
}

const STEPS: Step[] = [
  {
    id: "ch1",
    title: "How the Internet Works",
    subtitle: "HTTP, browsers, the web",
    duration: "1 week",
    icon: Globe,
    kind: "module",
    subtasks: [
      { id: "ch1-a", label: "Read: What is the internet?" },
      { id: "ch1-b", label: "Read: How does the internet work?" },
      { id: "ch1-c", label: "Read: Internet Routing Hierarchy" },
      { id: "ch1-d", label: "Assignment: Publish blog post on Medium", gate: { linkLabel: "Medium post URL" } },
    ],
  },
  {
    id: "ch2",
    title: "Interactivity & UX",
    subtitle: "JavaScript fundamentals",
    duration: "7 weeks",
    icon: Code2,
    kind: "module",
    subtasks: [
      { id: "ch2-a", label: "Intro to JavaScript" },
      { id: "ch2-b", label: "Variables, data types & operators" },
      { id: "ch2-c", label: "Functions & control structures" },
      { id: "ch2-d", label: "Manipulating HTML with JS (DOM)" },
      { id: "ch2-e", label: "Handling user events" },
      { id: "ch2-f", label: "Form validation & interactivity" },
    ],
  },
  {
    id: "ch3",
    title: "HTML & CSS",
    subtitle: "Structure & styling",
    duration: "3 weeks",
    icon: Layers,
    kind: "module",
    subtasks: [
      { id: "ch3-a", label: "Learn HTML — beginner course" },
      { id: "ch3-b", label: "HTML basics (Codecademy)" },
      { id: "ch3-c", label: "Learn CSS in 11 hours" },
      { id: "ch3-d", label: "CSS basic & advanced properties" },
      { id: "ch3-e", label: "Assignment: Build personal portfolio", gate: { linkLabel: "Portfolio website URL" } },
    ],
  },
  {
    id: "fc1",
    title: "Foundations Roundtable",
    subtitle: "Founders' Call · Month 3",
    duration: "Live call",
    icon: PhoneCall,
    kind: "call",
    callVariant: "fc1",
    prerequisites: ["ch1", "ch2", "ch3"],
  },
  {
    id: "ch4",
    title: "Version Control & Hosting",
    subtitle: "Git, GitHub, deploys",
    duration: "1 week",
    icon: GitBranch,
    kind: "module",
    subtasks: [
      { id: "ch4-a", label: "What is version control? Install Git" },
      { id: "ch4-b", label: "Learn Git, GitHub & GitHub Desktop" },
      { id: "ch4-c", label: "Deploy with GitHub Pages or Netlify" },
    ],
  },
  {
    id: "paid1",
    title: "Paid Project: Portfolio",
    subtitle: "Interactive portfolio build",
    duration: "4 weeks",
    icon: Briefcase,
    kind: "paid",
    subtasks: [
      { id: "paid1-a", label: "Plan & wireframe interactive portfolio" },
      { id: "paid1-b", label: "Set up dev environment & Git repo" },
      { id: "paid1-c", label: "Implement 3+ JavaScript features" },
      { id: "paid1-d", label: "Deploy to Netlify / GitHub Pages" },
      { id: "paid1-e", label: "Submit repo, live demo & video walkthrough", gate: { linkLabel: "Repo & live demo URL", videoLabel: "Video walkthrough URL (Loom / YouTube)" } },
    ],
  },
  {
    id: "ch5",
    title: "Dynamic Websites",
    subtitle: "Responsive & frameworks",
    duration: "2 weeks",
    icon: LayoutTemplate,
    kind: "module",
    subtasks: [
      { id: "ch5-a", label: "Watch full Bootstrap 5 course (YouTube)" },
      { id: "ch5-b", label: "Try out all code examples" },
      { id: "ch5-c", label: "Optional: W3Schools Bootstrap 5 exercises" },
      { id: "ch5-d", label: "Assignment: Recreate portfolio with Bootstrap 5", gate: { linkLabel: "Portfolio URL" } },
      { id: "ch5-e", label: "Share project video on Slack channel", gate: { videoLabel: "Project video URL (Loom / YouTube)" } },
    ],
  },
  {
    id: "ch6",
    title: "TypeScript",
    subtitle: "Typed JavaScript",
    duration: "2 weeks",
    icon: FileType2,
    kind: "module",
    subtasks: [
      { id: "ch6-a", label: "Read: Introduction to TypeScript (GeeksforGeeks)" },
      { id: "ch6-b", label: "Try out all TypeScript code examples" },
      { id: "ch6-c", label: "Go through beginner-friendly TypeScript tutorial (freeCodeCamp)" },
      { id: "ch6-d", label: "Watch TypeScript Tutorial full course (YouTube)" },
      { id: "ch6-e", label: "Complete all exercises" },
      { id: "ch6-f", label: "Assignment: Build a Task Manager app in TypeScript", gate: { linkLabel: "GitHub repo URL" } },
      { id: "ch6-g", label: "Share project video on Slack channel", gate: { videoLabel: "Project video URL (Loom / YouTube)" } },
    ],
  },
  { id: "fc2", title: "Resilience Roundtable", subtitle: "Founders' Call · Month 6", duration: "Live call", icon: PhoneCall, kind: "call", callVariant: "fc2", prerequisites: ["ch4", "paid1", "ch5", "ch6"] },
  {
    id: "ch7",
    title: "Databases",
    subtitle: "Design, query, manage",
    duration: "4 weeks",
    icon: Database,
    kind: "module",
    subtasks: [
      { id: "ch7-a", label: "Complete Khan Academy SQL course" },
      { id: "ch7-b", label: "Download & install MySQL" },
      { id: "ch7-c", label: "Optional: Codecademy Learn SQL course" },
      { id: "ch7-d", label: "Watch MongoDB YouTube course (tutorials 1–14)" },
      { id: "ch7-e", label: "W3Schools MongoDB aggregation tutorial" },
      { id: "ch7-f", label: "SQL Assignment: Install Northwind DB & complete queries", gate: { linkLabel: "Google Drive link (SQL query file)" } },
      { id: "ch7-g", label: "MongoDB Assignment: Import Mflix DB & complete queries", gate: { linkLabel: "Google Drive link (MongoDB query file)" } },
      { id: "ch7-h", label: "Submit query documents with comments to mentor", gate: { linkLabel: "Google Drive link" } },
    ],
  },
  {
    id: "ch8",
    title: "React",
    subtitle: "Components & state",
    duration: "6 weeks",
    icon: Atom,
    kind: "module",
    subtasks: [
      { id: "ch8-a", label: "Complete Introduction to React course (YouTube)" },
      { id: "ch8-b", label: "Try out all code examples in local editor" },
      { id: "ch8-c", label: "Complete Advanced React course (Codecademy)" },
      { id: "ch8-d", label: "Build Tic-Tac-Toe in React (react.dev tutorial)" },
      { id: "ch8-e", label: "Share Tic-Tac-Toe video on Slack channel", gate: { videoLabel: "Tic-Tac-Toe video URL (Loom / YouTube)" } },
    ],
  },
  { id: "fc3", title: "Full-Stack Momentum Call", subtitle: "Founders' Call · Month 9", duration: "Live call", icon: PhoneCall, kind: "call", callVariant: "fc3", prerequisites: ["ch7", "ch8"] },
  {
    id: "ch9",
    title: "Node.js",
    subtitle: "Server-side JavaScript",
    duration: "6 weeks",
    icon: Server,
    kind: "module",
    subtasks: [
      { id: "ch9-a", label: "Complete Codecademy Node.js course" },
      { id: "ch9-b", label: "Watch Node.js YouTube tutorial & try all examples locally" },
      { id: "ch9-c", label: "Watch Node.js crash course (YouTube)" },
      { id: "ch9-d", label: "Complete W3Schools Node tutorial with exercises" },
      { id: "ch9-e", label: "Complete Codecademy Express course" },
      { id: "ch9-f", label: "Optional: Read MDN Express/Node.js docs" },
      { id: "ch9-g", label: "Complete The Odin Project Node.js course" },
      { id: "ch9-h", label: "Submit Odin Project projects to Google Drive", gate: { linkLabel: "Google Drive link" } },
    ],
  },
  {
    id: "paid2",
    title: "Paid Project: Full-Stack App",
    subtitle: "Capstone build",
    duration: "2–3 months",
    icon: Briefcase,
    kind: "paid",
    subtasks: [
      { id: "paid2-a", label: "Plan app idea, sketch wireframes & database schema" },
      { id: "paid2-b", label: "Set up Git repo, React frontend & Node.js backend" },
      { id: "paid2-c", label: "Implement user authentication (signup / login / logout)" },
      { id: "paid2-d", label: "Build CRUD API endpoints & connect to frontend" },
      { id: "paid2-e", label: "Integrate an external API or unique feature" },
      { id: "paid2-f", label: "Ensure responsive & intuitive UI" },
      { id: "paid2-g", label: "Test all features, fix bugs, get mentor feedback" },
      { id: "paid2-h", label: "Deploy frontend (Vercel/Netlify) & backend (Render/Heroku)" },
      { id: "paid2-i", label: "Upload source code to GitHub with README", gate: { linkLabel: "GitHub repo URL" } },
      { id: "paid2-j", label: "Record 5–10 min video walkthrough & submit", gate: { videoLabel: "Video walkthrough URL (Loom / YouTube)" } },
    ],
  },
  { id: "fc4", title: "Career Harvest Call", subtitle: "Founders' Call · Month 12", duration: "Master Gardener", icon: Sprout, kind: "call", callVariant: "fc4", prerequisites: ["ch9", "paid2"] },
];

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
    stat: "Over 5.4 billion people use the internet every day — and you now understand the protocol behind every single request they make.",
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
    description: q.author ? `— ${q.author}` : undefined,
    icon: "🌱",
    duration: 4000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

function Index() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
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
    // Notify mentor via edge function (fails silently if not deployed)
    const step = STEPS.find((s) => s.id === stepId);
    const noteText = notes[stepId];
    if (step && noteText) {
      try {
        await supabase.functions.invoke("notify-note-saved", {
          body: {
            chapterTitle: step.title,
            noteText,
            userName: (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "A participant",
            userEmail: user?.email ?? "",
          },
        });
      } catch {
        // Edge function not deployed yet — that's fine
      }
    }
  };

  const [bloomBurst, setBloomBurst] = useState(false);
  const prevCompletionRef = useRef<Record<string, boolean>>({});
  // Suppress bloom burst when onboarding pre-checks many chapters at once
  const skipNextBloom = useRef(false);

  // Auth guard — redirect to /login if not signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        setUserId(session.user.id);
        setUser(session.user);
        setAuthReady(true);
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
    prevCompletionRef.current = { ...completion }; // always update first

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
          description: `Source: ${fact.source}`,
          icon: "📊",
          duration: 7000,
        });
      }
      setBloomBurst(true);
      const t = setTimeout(() => setBloomBurst(false), 3200);
      return () => clearTimeout(t);
    }
  }, [completion]);

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

    // Founders call — block if prerequisites not met, otherwise show claim modal
    if (step.kind === "call" && step.callVariant && !checked[step.id]) {
      if (lockedCalls[step.id]) return; // prerequisites not done — silently ignore
      pendingCallStep.current = step;
      setCallClaimModal(step.callVariant);
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

  const handleSubmissionConfirm = (data: { link?: string; video?: string }) => {
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
  const CURRICULUM_STEPS = STEPS.filter((s) => s.kind !== "call");
  const completedCount = CURRICULUM_STEPS.filter((s) => completion[s.id]).length;
  const progress = (completedCount / CURRICULUM_STEPS.length) * 100;
  const allDone = completedCount === CURRICULUM_STEPS.length;

  // User profile derived values
  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "Gardener";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const lastActive = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const rootsActive = completion["ch1"] || completion["ch2"];
  const sproutActive = completion["ch2"] && completion["ch3"];
  const stemActive = completion["ch4"] && completion["paid1"];
  const flowerActive =
    completion["ch5"] && completion["ch6"] && completion["ch7"] && completion["ch8"];
  const exoticActive = completion["ch9"] && completion["paid2"];


  return (
    <div className="h-screen overflow-hidden bg-[color:var(--background)] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-[420px] h-full overflow-hidden bg-[color:var(--sidebar)] border-r border-[color:var(--sidebar-border)] flex flex-col">
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
            <div>
              <h1 className="font-serif text-lg tracking-tight text-[color:var(--sidebar-foreground)]">
                Code Blossom
              </h1>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                Full-Stack Curriculum
              </p>
            </div>
          </div>



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
                    className="w-5 h-5 rounded-md border-[color:var(--primary)]/40 data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:border-[color:var(--primary)]"
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
                                <span
                                  className={`text-[12.5px] leading-snug transition-all ${
                                    subChecked
                                      ? "text-[color:var(--muted-foreground)] line-through decoration-[color:var(--primary)]/50"
                                      : "text-[color:var(--sidebar-foreground)]"
                                  }`}
                                >
                                  {sub.label}
                                </span>
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
        <div className="shrink-0 flex items-center justify-between gap-4 mb-3">

          {/* Left: tagline + garden state caption */}
          <div>
            <h2 className="font-serif text-lg lg:text-xl tracking-tight text-[color:var(--foreground)] leading-tight">
              Code. Learn. Bloom.
            </h2>
            <p className="text-[11px] text-[color:var(--muted-foreground)] italic mt-0.5">
              {!rootsActive && "An empty plot, full of promise."}
              {rootsActive && !sproutActive && "Roots, quiet and luminous, take hold."}
              {sproutActive && !stemActive && "A sprout greets the morning sun."}
              {stemActive && !flowerActive && "Leaves unfurl toward the sky."}
              {flowerActive && !exoticActive && "First bloom — vivid and whole."}
              {exoticActive && "A secret garden, fully alive."}
            </p>
          </div>

          {/* Right: controls + profile */}
          <div className="flex items-center gap-2 shrink-0">
            {syncing && (
              <span title="Syncing…">
                <RefreshCw className="w-3.5 h-3.5 text-[color:var(--muted-foreground)] animate-spin" />
              </span>
            )}
            {streak > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                title={`${streak}-day streak! Keep it up 🔥`}
                style={{
                  background: theme === "dark" ? "oklch(0.35 0.08 55 / 0.5)" : "oklch(0.95 0.08 60 / 0.3)",
                  color: theme === "dark" ? "oklch(0.88 0.14 70)" : "oklch(0.55 0.15 50)",
                }}
              >
                <Flame className="w-3.5 h-3.5" />
                {streak} day streak
              </div>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl text-[color:var(--muted-foreground)] hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] hover:text-[color:var(--foreground)] transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="p-2 rounded-xl text-[color:var(--muted-foreground)] hover:bg-[oklch(0.92_0.025_85)] dark:hover:bg-[oklch(0.27_0.03_65)] hover:text-[color:var(--foreground)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-7 bg-[color:var(--border)] mx-1" />

            {/* Profile: avatar + name + last active */}
            <div className="flex items-center gap-2.5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[color:var(--primary)]/30 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.removeAttribute("style");
                  }}
                />
              ) : null}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
                  display: avatarUrl ? "none" : undefined,
                }}
              >
                {initials}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[color:var(--foreground)] leading-tight">
                  {displayName}
                </p>
                {lastActive && (
                  <p className="text-[11px] text-[color:var(--muted-foreground)] leading-tight mt-0.5">
                    Last active {lastActive}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Garden — takes all remaining space ──────────────────── */}
        <div className="flex-1 min-h-0">
          <BotanicalGarden
            rootsActive={rootsActive}
            sproutActive={sproutActive}
            stemActive={stemActive}
            flowerActive={flowerActive}
            exoticActive={exoticActive}
            isDark={theme === "dark"}
            bloomBurst={bloomBurst}
          />
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
    </div>
  );
}
