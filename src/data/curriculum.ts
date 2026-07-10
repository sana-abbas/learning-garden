import {
  Globe, Code2, Layers, GitBranch, LayoutTemplate, FileType2,
  Database, Atom, Server, Briefcase, PhoneCall, Sprout,
} from "lucide-react";
import type { SubmissionGate } from "@/components/garden/SubmissionModal";
import type { MilestoneVariant } from "@/components/garden/MilestoneModal";

export type StepKind = "module" | "paid" | "call";

export interface SubTask {
  id: string;
  label: string;
  url?: string;
  gate?: SubmissionGate;
}

export interface Step {
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

export const STEPS: Step[] = [
  {
    id: "ch1",
    title: "How the Internet Works",
    subtitle: "HTTP, browsers, the web",
    duration: "1 week",
    icon: Globe,
    kind: "module",
    subtasks: [
      { id: "ch1-a", label: "Read: What is the internet?", url: "https://www.geeksforgeeks.org/computer-science-fundamentals/what-is-internet-definition-uses-working-advantages-and-disadvantages/" },
      { id: "ch1-b", label: "Read: How does the internet work?", url: "https://www.cloudflare.com/learning/network-layer/how-does-the-internet-work/" },
      { id: "ch1-c", label: "Read: Internet Routing Hierarchy", url: "https://www.geeksforgeeks.org/hierarchical-routing/" },
      { id: "ch1-d", label: "Assignment: Publish blog post on Medium", gate: { linkLabel: "Medium post URL", linkDomains: ["medium.com"] } },
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
      { id: "ch2-a", label: "Intro to JavaScript", url: "https://www.codecademy.com/learn/introduction-to-javascript" },
      { id: "ch2-b", label: "Variables, data types & operators", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures" },
      { id: "ch2-c", label: "Functions & control structures", url: "https://drive.google.com/file/d/1-oJaQCheqcifpdCR7P9QfzCbNaYFN1Me/view?usp=sharing" },
      { id: "ch2-d", label: "Manipulating HTML with JS (DOM)", url: "https://www.geeksforgeeks.org/manipulating-html-elements-with-javascript/" },
      { id: "ch2-e", label: "Handling user events", url: "https://www.javascripttutorial.net/javascript-dom/handling-events-in-javascript/" },
      { id: "ch2-f", label: "Form validation & interactivity", url: "https://www.geeksforgeeks.org/form-validation-using-javascript/" },
      { id: "ch2-g", label: "JavaScript Hands-On Practice", url: "https://drive.google.com/file/d/1T75Q9mowT44m6vumfcNhgMCT4POC72tA/view?usp=sharing" },
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
      { id: "ch3-a", label: "Learn HTML — beginner course", url: "https://www.freecodecamp.org/news/learn-html-beginners-course/" },
      { id: "ch3-b", label: "HTML basics (Codecademy)", url: "https://www.codecademy.com/learn/learn-html" },
      { id: "ch3-c", label: "Learn CSS in 11 hours", url: "https://www.freecodecamp.org/news/learn-css-in-11-hours/" },
      { id: "ch3-d", label: "CSS basic & advanced properties", url: "https://www.codecademy.com/learn/learn-css" },
      { id: "ch3-e", label: "Assignment: Build personal portfolio", gate: { linkLabel: "Portfolio website URL", videoLabel: "Video walkthrough URL (Loom / YouTube)" } },
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
      { id: "ch4-a", label: "What is version control? Install Git", url: "https://www.atlassian.com/git/tutorials/what-is-version-control" },
      { id: "ch4-b", label: "Learn Git, GitHub & GitHub Desktop", url: "https://www.simplilearn.com/tutorials/git-tutorial" },
      { id: "ch4-c", label: "Deploy with GitHub Pages or Netlify", url: "https://www.youtube.com/watch?v=iw4o2BZ0vy0" },
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
      { id: "paid1-e", label: "Submit repo, live demo & video walkthrough", gate: { linkLabel: "GitHub repo URL", linkDomains: ["github.com"], link2Label: "Live demo URL", videoLabel: "Video walkthrough URL (Loom / YouTube)" } },
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
      { id: "ch5-a", label: "Watch full Bootstrap 5 course (YouTube)", url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9joIM91nLzd_qaH_AimmdAR" },
      { id: "ch5-b", label: "Try out all code examples" },
      { id: "ch5-c", label: "Optional: W3Schools Bootstrap 5 exercises", url: "https://www.w3schools.com/bootstrap5/index.php" },
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
      { id: "ch6-a", label: "Read: Introduction to TypeScript (GeeksforGeeks)", url: "https://www.geeksforgeeks.org/introduction-to-typescript/" },
      { id: "ch6-b", label: "Try out all TypeScript code examples" },
      { id: "ch6-c", label: "Go through beginner-friendly TypeScript tutorial (freeCodeCamp)", url: "https://www.freecodecamp.org/news/an-introduction-to-typescript/" },
      { id: "ch6-d", label: "Watch TypeScript Tutorial full course (YouTube)", url: "https://www.youtube.com/watch?v=d56mG7DezGs" },
      { id: "ch6-e", label: "Complete all exercises" },
      { id: "ch6-f", label: "Assignment: Build a Task Manager app in TypeScript", gate: { linkLabel: "GitHub repo URL", linkDomains: ["github.com"] } },
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
      { id: "ch7-a", label: "Complete Khan Academy SQL course", url: "https://www.khanacademy.org/computing/computer-programming/sql" },
      { id: "ch7-b", label: "Download & install MySQL", url: "https://www.youtube.com/watch?v=hiS_mWZmmI0" },
      { id: "ch7-c", label: "Optional: Codecademy Learn SQL course", url: "https://www.codecademy.com/learn/learn-sql" },
      { id: "ch7-d", label: "Watch MongoDB YouTube course (tutorials 1–14)", url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9h77dJ-QJlwGlZlTd4ecZOA" },
      { id: "ch7-e", label: "W3Schools MongoDB aggregation tutorial", url: "https://www.w3schools.com/mongodb/mongodb_aggregations_intro.php" },
      { id: "ch7-f", label: "SQL Assignment: Install Northwind DB & complete queries", url: "https://documentation.alphasoftware.com/documentation/pages/GettingStarted/GettingStartedTutorials/Basic%20Tutorials/Northwind/northwindMySQL.xml", gate: { linkLabel: "Google Drive link (SQL query file)", linkDomains: ["drive.google.com"] } },
      { id: "ch7-g", label: "MongoDB Assignment: Import Mflix DB & complete queries", url: "https://drive.google.com/drive/folders/1wKKO92Ex39-yZ9JHG2Kw_VgKnL-JGAci?usp=drive_link", gate: { linkLabel: "Google Drive link (MongoDB query file)", linkDomains: ["drive.google.com"] } },
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
      { id: "ch8-a", label: "Complete Introduction to React course (YouTube)", url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d" },
      { id: "ch8-b", label: "Try out all code examples in local editor" },
      { id: "ch8-c", label: "Complete Advanced React course (Codecademy)", url: "https://www.codecademy.com/learn/react-101" },
      { id: "ch8-d", label: "Build Tic-Tac-Toe in React (react.dev tutorial)", url: "https://react.dev/learn/tutorial-tic-tac-toe" },
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
      { id: "ch9-a", label: "Complete Codecademy Node.js course", url: "https://www.codecademy.com/learn/learn-node-js" },
      { id: "ch9-b", label: "Watch Node.js YouTube tutorial & try all examples locally", url: "https://youtube.com/playlist?list=PL4cUxeGkcC9jsz4LDYc6kv3ymONOKxwBU&feature=shared" },
      { id: "ch9-c", label: "Watch Node.js crash course (YouTube)", url: "https://www.youtube.com/watch?v=32M1al-Y6Ag&t=0s" },
      { id: "ch9-d", label: "Complete W3Schools Node tutorial with exercises", url: "https://www.w3schools.com/nodejs/default.asp" },
      { id: "ch9-e", label: "Complete Codecademy Express course", url: "https://www.codecademy.com/learn/learn-express" },
      { id: "ch9-f", label: "Optional: Read MDN Express/Node.js docs", url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs" },
      { id: "ch9-g", label: "Complete The Odin Project Node.js course", url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs" },
      { id: "ch9-h", label: "Submit Odin Project projects to Google Drive", gate: { linkLabel: "Google Drive link", linkDomains: ["drive.google.com"] } },
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
      { id: "paid2-i", label: "Upload source code to GitHub with README", gate: { linkLabel: "GitHub repo URL", linkDomains: ["github.com"] } },
      { id: "paid2-j", label: "Record 5–10 min video walkthrough & submit", gate: { videoLabel: "Video walkthrough URL (Loom / YouTube)" } },
    ],
  },
  { id: "fc4", title: "Career Harvest Call", subtitle: "Founders' Call · Month 12", duration: "Master Gardener", icon: Sprout, kind: "call", callVariant: "fc4", prerequisites: ["ch9", "paid2"] },
];

export const CURRICULUM_STEPS = STEPS.filter((s) => s.kind !== "call");
