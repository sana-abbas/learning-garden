// Auto-checkers for exercise subtasks.
// Each checker takes the student's pasted answer and returns a result.
// Keyed by subtask ID.
//
// Blocking vs advisory
// ────────────────────
// A checker only BLOCKS submission when we can prove the answer is wrong:
// the code doesn't parse, or a requirement the exercise text explicitly
// states is missing. Everything else — prose explanations, guesses about
// *how* a student chose to solve it — is ADVISORY: the hint is shown, the
// student can still submit, and a mentor reviews it.
//
// Never block on something the exercise prompt didn't ask for.

export interface CheckResult {
  correct: boolean;
  feedback: string;
  /** When false, the student may submit anyway. Defaults to true. */
  blocking?: boolean;
}

type Checker = (answer: string) => CheckResult;

const pass = (feedback = "Correct!"): CheckResult => ({ correct: true, feedback });

/** Provably wrong — blocks submission. */
const fail = (feedback: string): CheckResult => ({ correct: false, feedback, blocking: true });

/** Probably wrong, but we can't prove it — shows the hint, still submittable. */
const hint = (feedback: string): CheckResult => ({ correct: false, feedback, blocking: false });

// ── Shared: syntax gate ───────────────────────────────────────────────────────
// Students paste code straight out of the lesson, fences and all. Strip the
// markdown wrapper, then compile (never run) the result. `new Function` parses
// the body without executing a single statement, so an infinite loop or a
// rogue fetch in a student's answer costs us nothing.

function stripCodeFences(src: string): string {
  return src.replace(/^[ \t]*```[\w-]*[ \t]*$/gm, "");
}

/** Returns a blocking CheckResult if the answer isn't parseable JS, else null. */
function checkJsSyntax(answer: string): CheckResult | null {
  const src = stripCodeFences(answer);
  if (!src.trim()) return null;

  try {
    new Function(src);
    return null;
  } catch (err) {
    // Top-level await is legal in some answers (cf16-c) but not in a plain
    // Function body — retry inside an async wrapper before calling it broken.
    try {
      new Function(`return (async () => {\n${src}\n})`);
      return null;
    } catch {
      /* genuinely broken — fall through and report the original error */
    }
    const message = err instanceof Error ? err.message : String(err);
    return fail(`There's a syntax error in your code: ${message}. Check your brackets, braces and quotes.`);
  }
}

// ── cf1-c: Reorganize the algorithm ──────────────────────────────────────────
//
// Shuffled steps given to students:
//  1. Rinse the rice until the water is almost clear.
//  2. Separate 100g of rice.
//  3. Cover the pot with a lid and put it on the stove at a high temperature.
//  4. Cook for 8 minutes.
//  5. Serve the rice.
//  6. Remove the pot from the stove.
//  7. Add 200ml of salted water to the pot so that the rice is covered.
//  8. Add rice to a pot.
//  9. When water starts to boil, decrease the temperature.
// 10. If the rice is too hard, add more water and cook for 2 more minutes.
//
// Correct order: 2, 1, 8, 7, 3, 9, 4, 10, 6, 5

const CF1C_CORRECT = [2, 1, 8, 7, 3, 9, 4, 10, 6, 5];

// Keywords that identify each shuffled step (index 0 = step 1, etc.)
const CF1C_KEYWORDS = [
  ["rinse", "almost clear"],                          // step 1
  ["separate", "100g"],                               // step 2
  ["cover the pot", "lid", "high temperature", "high fire"], // step 3
  ["cook for 8", "8 minutes"],                        // step 4
  ["serve"],                                          // step 5
  ["remove the pot", "from the stove"],               // step 6
  ["200ml", "salted water"],                          // step 7
  ["add rice to a pot", "rice to a pot"],             // step 8
  ["boil", "decrease"],                               // step 9
  ["too hard", "2 more minutes", "more 2 minutes"],   // step 10
];

function matchesStep(text: string, stepIndex: number): boolean {
  const lower = text.toLowerCase();
  return CF1C_KEYWORDS[stepIndex].some((kw) => lower.includes(kw));
}

function extractNumbers(answer: string): number[] {
  return (answer.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 1 && n <= 10);
}

function checkByNumbers(nums: number[]): CheckResult {
  if (nums.length < 10) {
    return hint(`Found ${nums.length} numbers — make sure to include all 10 steps.`);
  }
  const seq = nums.slice(0, 10);
  const wrong = seq.findIndex((n, i) => n !== CF1C_CORRECT[i]);
  if (wrong === -1) {
    return pass("Correct! That's the right order.");
  }
  // A numbered answer has one correct order, so this one is provable.
  return fail(`Position ${wrong + 1} looks off — got step ${seq[wrong]}, expected step ${CF1C_CORRECT[wrong]}.`);
}

function checkByText(answer: string): CheckResult {
  // Split into lines/sentences and detect which original steps appear, in order
  const parts = answer.split(/[\n,;.]+/).map((s) => s.trim()).filter(Boolean);
  const detected: number[] = [];
  for (const part of parts) {
    for (let i = 0; i < CF1C_KEYWORDS.length; i++) {
      if (matchesStep(part, i) && !detected.includes(i + 1)) {
        detected.push(i + 1);
      }
    }
  }
  // Recognising free-written steps by keyword is a guess, so everything on this
  // path is advisory — we can't prove a paraphrased answer wrong.
  if (detected.length < 5) {
    return hint("Couldn't recognise enough steps. Try numbering your answer (e.g. 2, 1, 8…) or write the steps more clearly.");
  }
  // Compare recognised order against correct
  const correctSubset = CF1C_CORRECT.filter((n) => detected.includes(n));
  const matches = detected.every((n, i) => n === correctSubset[i]);
  if (matches && detected.length >= 8) {
    return pass("Correct! That's the right order.");
  }
  const wrongPos = detected.findIndex((n, i) => n !== correctSubset[i]);
  return hint(
    wrongPos === -1
      ? "Almost — make sure you've included all 10 steps in the correct order."
      : `Step "${CF1C_KEYWORDS[detected[wrongPos] - 1][0]}" seems to be in the wrong position.`,
  );
}

const cf1c: Checker = (answer) => {
  const nums = extractNumbers(answer);
  // If the student submitted numbers only (or numbers with minimal text), check numerically
  const isNumberFormat = nums.length >= 8 && answer.replace(/[\d,.\s\n;-]/g, "").length < 30;
  if (isNumberFormat) return checkByNumbers(nums);
  return checkByText(answer);
};

// ── cf2-b: Hello, World! in the console ──────────────────────────────────────
// Solution: console.log("Hello World!");

// Backticks count: a template literal is a perfectly good string.
const HELLO_WORLD = /console\.log\s*\(\s*["'`]hello world!["'`]\s*\)/i;

const cf2b: Checker = (answer) => {
  const norm = answer.trim().replace(/\s+/g, " ");
  if (HELLO_WORLD.test(norm)) return pass();
  if (norm.toLowerCase().includes("console.log"))
    return fail('Close — make sure the message is "Hello World!" with an exclamation mark.');
  return fail("Use console.log() to print the message.");
};

// ── cf2-c: Hello, World! in the web browser ──────────────────────────────────
// Solution: <script>console.log("Hello World!");</script>

const cf2c: Checker = (answer) => {
  const norm = answer.trim().replace(/\s+/g, " ");
  const hasScript = /<script[\s>]/i.test(norm) && /<\/script>/i.test(norm);
  const hasLog = HELLO_WORLD.test(norm);
  if (hasScript && hasLog) return { correct: true, feedback: "Correct!" };
  if (!hasScript)
    return { correct: false, feedback: 'Wrap your code in a <script>...</script> tag.' };
  if (!hasLog)
    return { correct: false, feedback: 'Add console.log("Hello World!") inside your script tag.' };
  return { correct: false, feedback: 'Check that the message includes "Hello World!" with an exclamation mark.' };
};

// ── cf3-c: Declaration and assignments of variables ──────────────────────────
// Must declare a let and a const, reassign the let, and attempt to reassign the const.

const cf3c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  const hasLet = /\blet\b/.test(norm);
  const hasConst = /\bconst\b/.test(norm);
  // A reassignment line: identifier = value, not preceded by let/const/var
  const hasReassign = /^(?!.*\b(let|const|var)\b).*\w+\s*=\s*\S+/m.test(answer);
  const hasLog = /console\.log/.test(norm);

  if (!hasLet) return fail("Declare at least one variable using let.");
  if (!hasConst) return fail("Declare at least one variable using const.");
  if (!hasReassign) return fail("Make sure you reassign a variable after its initial declaration.");
  if (!hasLog) return fail("Use console.log() to print the values.");

  // The point of the exercise is observing that reassigning a const throws.
  const constNames = [...answer.matchAll(/\bconst\s+([a-z_$][\w$]*)/gi)].map((m) => m[1]);
  const triedConstReassign = constNames.some((name) =>
    new RegExp(`(^|[^.\\w])${name}\\s*=[^=]`, "m").test(answer.replace(new RegExp(`const\\s+${name}\\s*=`, "g"), "")),
  );
  if (!triedConstReassign)
    return hint("Try reassigning the const one too, and see what the console says — that's the part worth observing here.");

  return pass();
};

// ── cf3-d: Testing data types ─────────────────────────────────────────────────
// Must use typeof on at least 5 of the 7 primitive types.

const CF3D_TYPES: Array<[string, RegExp]> = [
  ["boolean",   /\btrue\b|\bfalse\b/],
  ["null",      /\bnull\b/],
  ["undefined", /\bundefined\b|\bnotAssigned|let\s+\w+\s*;/],
  ["number",    /\b\d+\b/],
  ["string",    /["'][^"']+["']/],
  ["symbol",    /\bSymbol\s*\(/i],
  ["object",    /\{[^}]+\}/],
];

const cf3d: Checker = (answer) => {
  if (!/typeof/.test(answer))
    return fail("Use the typeof operator to check data types.");

  // The type regexes are loose enough that a comment can satisfy them, so also
  // require typeof to be used more than once — the prompt says "each variable".
  const typeofCount = (answer.match(/typeof/g) ?? []).length;
  if (typeofCount < 3)
    return fail("Log the type of each of your variables — use typeof on each one, not just the first.");

  const found = CF3D_TYPES.filter(([, re]) => re.test(answer)).map(([name]) => name);
  if (found.length >= 5) return pass();

  const missing = CF3D_TYPES.map(([name]) => name).filter((n) => !found.includes(n));
  return hint(`Good start — also try these types: ${missing.join(", ")}.`);
};

// ── cf4-c: Find the right result for each operator ───────────────────────────
// Correct results: 7, 4, 10, 3, 1, true, true, false, false, false, true, true

const CF4C_CHECKS: Array<{ expr: RegExp; result: RegExp; label: string }> = [
  { expr: /4\s*\+\s*3/, result: /=+\s*7/,     label: "4 + 3 → 7" },
  { expr: /10\s*-\s*6/, result: /=+\s*4/,     label: "10 - 6 → 4" },
  { expr: /2\s*\*\s*5/, result: /=+\s*10/,    label: "2 * 5 → 10" },
  { expr: /9\s*\/\s*3/, result: /=+\s*3/,     label: "9 / 3 → 3" },
  { expr: /7\s*%\s*3/,  result: /=+\s*1/,     label: "7 % 3 → 1" },
  { expr: /5\s*>\s*2/,  result: /=+\s*true/,  label: "5 > 2 → true" },
  { expr: /10\s*===\s*["']10["']/, result: /=+\s*false/, label: '10 === "10" → false' },
  { expr: /8\s*!==\s*8/, result: /=+\s*false/, label: "8 !== 8 → false" },
  { expr: /true\s*&&\s*false/, result: /=+\s*false/, label: "true && false → false" },
  // The prompt now brackets this as `(true || false) === X`. Without the
  // brackets it parsed as `true || (false === X)`, which short-circuits to true
  // for BOTH values of X and left the question with two correct answers.
  { expr: /true\s*\|\|\s*false/, result: /=+\s*true/, label: "true || false → true" },
  { expr: /!false/, result: /=+\s*true/, label: "!false → true" },
];

const cf4c: Checker = (answer) => {
  if (!/console\.log/.test(answer))
    return fail("Use console.log() to print each result.");

  // Previously a missing expression was silently skipped, so deleting a line
  // counted as correct. Missing lines are now reported.
  const missing = CF4C_CHECKS.filter(({ expr }) => !expr.test(answer));
  if (missing.length)
    return fail(`These lines are missing from your answer: ${missing.map((m) => m.label).join(", ")}.`);

  const wrong = CF4C_CHECKS.filter(({ expr, result }) => {
    const match = answer.match(expr);
    if (!match) return false;
    const afterExpr = answer.slice(answer.search(expr) + match[0].length);
    return !result.test(afterExpr.slice(0, 20));
  });

  if (wrong.length === 0) return pass();
  return fail(`Check the result for: ${wrong.map((w) => w.label).join(", ")}.`);
};

// ── cf4-d: Find the operator for the given result ─────────────────────────────
// Correct operators: +, *, /, ==, >, &&/!

const CF4D_CHECKS: Array<{ expr: RegExp; label: string }> = [
  { expr: /6\s*\+\s*4/,          label: "6 + 4 = 10" },
  { expr: /5\s*\*\s*5/,          label: "5 * 5 = 25" },
  { expr: /24\s*\/\s*8/,         label: "24 / 8 = 3" },
  { expr: /12\s*==\s*["']12["']/, label: '12 == "12"' },
  // These last two lines are under-determined: the exercise's rule is "it should
  // print true", and more than one operator satisfies each. Rejecting the
  // alternatives would mark correct answers wrong, so accept them all.
  //   9 ? 4 === true      → >, >=, != and !== all print true
  //   !false ? !false     → &&, ||, == and === all print true
  { expr: /9\s*(>=?|!==?)\s*4/, label: "9 > 4" },
  { expr: /!false\s*(&&|\|\||===?)\s*!false/, label: "!false && !false" },
];

const cf4d: Checker = (answer) => {
  if (!/console\.log/.test(answer))
    return fail("Use console.log() to print each result.");

  const missing = CF4D_CHECKS.filter(({ expr }) => !expr.test(answer));
  if (missing.length === 0) return pass();
  return fail(`Missing or incorrect operator for: ${missing.map((m) => m.label).join(", ")}.`);
};

// ── cf5-b: Check the number ───────────────────────────────────────────────────
// Must use if / else if / else and log a message for positive, negative, zero.

const cf5b: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bif\b/.test(norm))
    return fail("Use an if statement to check the number.");
  if (!/else\s+if\s*\(/.test(norm))
    return fail("Use else if (with a condition in brackets) to handle all three cases: positive, negative, and zero.");
  if (!/\belse\b/.test(norm))
    return fail("Add an else branch to handle the zero case.");
  if (!/console\.log/.test(norm))
    return fail("Use console.log() to print the result.");

  const hasPositive = />\s*0/.test(answer);
  const hasNegative = /<\s*0/.test(answer);
  if (!hasPositive || !hasNegative)
    return fail("Check your conditions — you need to compare n > 0 and n < 0.");

  // The prompt says "a number n" without saying to declare it, so this is a
  // nudge rather than a gate — but the code can't run without it.
  if (!/\b(let|const|var)\s+n\b/.test(answer))
    return hint("Declare n before the if statement (e.g. let n = -5;) so the code can actually run.");

  return pass();
};

// ── cf5-e: Print the season given the month ───────────────────────────────────
// Must use switch with grouped cases for all 4 seasons + default.

const CF5E_SEASONS: Array<{ name: string; months: number[] }> = [
  { name: "winter", months: [12, 1, 2] },
  { name: "spring", months: [3, 4, 5] },
  { name: "summer", months: [6, 7, 8] },
  { name: "fall",   months: [9, 10, 11] },
];

const cf5e: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bswitch\b/.test(norm))
    return fail("Use a switch statement.");

  // One switch, not one per season — nested/repeated switches were the most
  // common way this exercise went wrong.
  const switchCount = (norm.match(/\bswitch\s*\(/g) ?? []).length;
  if (switchCount > 1)
    return fail(`You've opened ${switchCount} switch statements. Use a single switch on "month" and group the cases for each season inside it.`);

  if (!/\bdefault\b/.test(norm))
    return fail("Add a default case for invalid month values.");

  const breakCount = (norm.match(/\bbreak\b/g) ?? []).length;
  if (breakCount < 4)
    return fail(`Each season needs its own break to prevent fall-through — found ${breakCount}, expected 4.`);

  const missingSeason = CF5E_SEASONS.find(({ name }) => !norm.includes(name));
  if (missingSeason)
    return fail(`Missing season: "${missingSeason.name}".`);

  const missingMonth = CF5E_SEASONS.flatMap(({ months }) => months)
    .find((m) => !new RegExp(`\\bcase\\s+${m}\\b`).test(norm));
  if (missingMonth !== undefined)
    return fail(`Missing case for month ${missingMonth}.`);

  if (!/\bconsole\.log/.test(norm))
    return fail("Use console.log() to print the season.");

  // The prompt asks for an error *message* in the default case, so the default
  // branch has to print something rather than just reassigning month.
  const defaultBody = norm.slice(norm.indexOf("default"));
  if (!/console\.log/.test(defaultBody))
    return fail("Your default case should log an error message, not just assign it to a variable.");

  if (!/\b(let|const|var)\s+month\b/.test(norm))
    return hint("Declare month before the switch (e.g. let month = 4;) so the code can actually run.");

  return pass();
};

// ── cf6-c: Invert the number ──────────────────────────────────────────────────
// Must use a while loop, extract digits with % 10, and truncate with Math.floor.

const cf6c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bwhile\b/.test(norm))
    return { correct: false, feedback: "Use a while loop to reverse the number." };
  if (!/%\s*10/.test(answer))
    return { correct: false, feedback: "Use % 10 to extract the last digit." };
  if (!/math\.(floor|trunc)|parseint|>>\s*0|\|\s*0/i.test(answer))
    return fail("Remove the last digit after each iteration (e.g. with Math.floor()).");
  if (!/console\.log/.test(norm))
    return fail("Use console.log() to print the reversed number.");
  return pass();
};

// ── cf6-f: Sum up the numbers ─────────────────────────────────────────────────
// Must use a for loop summing 1 to 10 (result: 55).

const cf6f: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bfor\b/.test(norm))
    return fail("Use a for loop to iterate over the numbers.");

  // The prompt never names the loop variable, so accept any identifier —
  // counting up to 10 or down from it.
  const IDENT = String.raw`[a-z_$][\w$]*`;
  const countsUp = new RegExp(`\\b${IDENT}\\s*<=\\s*10\\b|\\b${IDENT}\\s*<\\s*11\\b`, "i").test(answer);
  const countsDown = new RegExp(`\\b${IDENT}\\s*>=\\s*1\\b|\\b${IDENT}\\s*>\\s*0\\b`, "i").test(answer);
  if (!countsUp && !countsDown)
    return fail("Make sure your loop runs up to and including 10.");

  // `total += i`, or `anyName = anyName + anyOther` via a backreference.
  const accumulates = /\+=/.test(answer) || new RegExp(`\\b(${IDENT})\\s*=\\s*\\1\\s*\\+`, "i").test(answer);
  if (!accumulates)
    return fail("Accumulate the sum inside the loop (e.g. total += i).");

  if (!/console\.log/.test(norm))
    return fail("Use console.log() to print the result.");
  return pass("Correct! The sum of 1 to 10 is 55.");
};

// ── cf7-c: Filter the numbers ─────────────────────────────────────────────────
// Must use filter() with a % 2 even check.

const cf7c: Checker = (answer) => {
  if (!/\.filter\s*\(/.test(answer))
    return fail("Use the filter() method on your array.");
  if (!/%\s*2/.test(answer))
    return fail("Use % 2 inside filter() to check for even numbers.");

  // `% 2` alone used to pass, so filtering for ODD numbers counted as correct.
  const keepsEven = /%\s*2\s*={2,3}\s*0/.test(answer) || /!\s*\(?[^)]*%\s*2/.test(answer);
  const keepsOdd = /%\s*2\s*={2,3}\s*1/.test(answer) || /%\s*2\s*!={1,2}\s*0/.test(answer);
  if (keepsOdd && !keepsEven)
    return fail("That filter keeps the odd numbers — the exercise asks for the even ones (n % 2 === 0).");
  if (!keepsEven)
    return hint("Check your filter condition — an even number is one where n % 2 === 0.");

  if (!/console\.log/.test(answer))
    return fail("Use console.log() to print the result.");
  return pass();
};

// ── cf7-d: Map the adults of the family ──────────────────────────────────────
// Must traverse nested array, check age >= 18, collect names.

const cf7d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  // \bfor\b deliberately does not match forEach, so array methods are listed
  // explicitly — the prompt doesn't prescribe how to traverse, only that
  // indexes aren't hardcoded.
  const traverses = /\bwhile\b|\bfor\b/.test(norm) || /\.(forEach|map|filter|reduce|flat|flatMap)\s*\(/i.test(answer);
  if (!traverses)
    return fail("Use a loop or an array method (forEach, map, filter…) to traverse the family.");
  if (!/>=\s*18|18\s*<=|>\s*17/.test(answer))
    return fail("Check age >= 18 to determine if someone is an adult.");
  if (!/console\.log/.test(norm))
    return fail("Use console.log() to print the adults.");

  // "Do not hardcode the access to a specific person by index" is an explicit
  // instruction, so a literal family[0][1] style index is worth flagging.
  if (/\[\s*[0-9]\s*\]\s*\[\s*[0-9]\s*\]/.test(answer))
    return hint("Looks like you're indexing into the array directly — the exercise asks for a solution that works on any family, without hardcoded positions.");

  return pass();
};

// ── cf7-g: Web browser navigation ────────────────────────────────────────────
// Must use two stacks with push/pop, handle back/forward, clear forward on new visit.

const cf7g: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\.push\s*\(/.test(answer))
    return fail("Use push() to add pages to your stack(s).");
  if (!/\.pop\s*\(\)/.test(answer))
    return fail("Use pop() to go back/forward in your stack.");

  // Two array variables, however they're initialised — seeding one with the
  // first URL is perfectly valid and used to fail the old "two []" rule.
  const arrayDecls = (answer.match(/\b(let|const|var)\s+[a-z_$][\w$]*\s*=\s*\[/gi) ?? []).length;
  if (arrayDecls < 2)
    return fail("Use two separate stacks — one for back history and one for forward history.");

  // Clearing the forward stack on a new visit, under any variable name.
  if (!/=\s*\[\s*\]/.test(answer) && !/\.length\s*=\s*0/.test(answer) && !/\.splice\s*\(/.test(answer))
    return hint("Remember to clear the forward history when you visit a new page — otherwise 'forth' would jump to a page you've navigated away from.");

  if (!/console\.log/.test(norm))
    return fail("Use console.log() to log each page visited.");
  return pass();
};

// ── cf7-j: Printer queue ──────────────────────────────────────────────────────
// Must use push() and shift() to simulate FIFO queue.

const cf7j: Checker = (answer) => {
  if (!/\.shift\s*\(\)/.test(answer))
    return { correct: false, feedback: "Use shift() to remove and print the first file in the queue (FIFO)." };
  if (!/\.push\s*\(/.test(answer))
    return { correct: false, feedback: "Use push() to add the new file to the queue." };
  if (!/statistics_?data/i.test(answer))
    return fail("Make sure to add Statistics_data.json to the queue after the first file is printed.");
  if (!/console\.log/.test(answer))
    return { correct: false, feedback: "Use console.log() to log each printed file and the current queue." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf7-m: Library ────────────────────────────────────────────────────────────
// Must model the book object with isAvailable, readerCount, isPopular logic.

const cf7m: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/isavailable/i.test(answer))
    return { correct: false, feedback: "Your book object needs an isAvailable property." };
  if (!/readercount/i.test(answer))
    return { correct: false, feedback: "Your book object needs a readerCount property." };
  if (!/ispopular/i.test(answer))
    return { correct: false, feedback: "Your book object needs an isPopular property." };
  if (!/readerCount\s*\+\+|readerCount\s*\+=\s*1/i.test(answer))
    return { correct: false, feedback: "Increment readerCount when the book is borrowed." };
  if (!/>=\s*150|150\s*<=/.test(answer))
    return { correct: false, feedback: "Set isPopular to true when readerCount reaches 150 or more." };
  // Counting occurrences is a proxy for "you updated it in both places", which
  // a helper-function solution legitimately fails — so advise, don't block.
  if ((norm.match(/\bisavailable\b/g) ?? []).length < 3)
    return hint("Check that isAvailable is updated both when the book is borrowed and when it's returned.");
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to log each step." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf8-c: Write the rice recipe in JavaScript ────────────────────────────────
// Must define cookRice(amountOfRice), use functions, loops, conditionals, console.log.

const cf8c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/function\s+cookrice\s*\(/i.test(answer))
    return { correct: false, feedback: "Define a main function called cookRice(amountOfRice)." };
  if ((answer.match(/\bfunction\b/gi) ?? []).length < 2)
    return hint("Try breaking the recipe into smaller helper functions — the prompt suggests it, and it makes the main function much easier to read.");
  if (!/\bfor\b/.test(norm) && !/\bwhile\b/.test(norm))
    return fail("Use a loop to simulate the waiting time while the rice cooks.");
  if (!/\bif\b/.test(norm))
    return fail("Use an if statement to check if the rice is still hard and cook for 2 more minutes if so.");
  if (!/console\.log/.test(norm))
    return fail("Use console.log() to print messages at each step.");
  if (!/cookrice\s*\(\s*[^)\s][^)]*\)/i.test(answer))
    return fail("Call cookRice() with an amount at the end (e.g. cookRice(100)).");
  return pass();
};

// ── cf8-f: Tracking the execution flow ───────────────────────────────────────
// myFunction(6) = 6 + myFunction(4) = 6 + 4 + myFunction(2) = 6 + 4 + 2 + myFunction(0)
// myFunction(0): n<=1 → return 1. Result = 6+4+2+1 = 13.

// A pen-and-paper trace written in the student's own words — advisory only.

const cf8f: Checker = (answer) => {
  if (!/\b13\b/.test(answer))
    return hint("The final result isn't 13. Trace each call: myFunction(6) → myFunction(4) → myFunction(2) → myFunction(0) returns 1, then add back up.");
  if (!/myfunction\s*\(\s*[024]\s*\)|myfunc.*[024]/i.test(answer))
    return hint("Show the full recursive trace — include myFunction(4), myFunction(2), and myFunction(0) in your working.");
  if (!/myfunction\s*\(\s*0\s*\)|n\s*<=\s*1|returns?\s*1/i.test(answer))
    return hint("Show the base case: myFunction(0) returns 1 because n <= 1.");
  return pass("Correct! finalResult = 13.");
};

// ── cf8-g: Count the family members ──────────────────────────────────────────
// Family has 9 members. Must use a recursive function (no hardcoded indexes).

const cf8g: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bfunction\b/.test(norm))
    return { correct: false, feedback: "Write a recursive function (e.g. getFamilyNames) to traverse the family tree." };
  if (!/\.children/.test(answer))
    return { correct: false, feedback: "Access the .children property to recurse into each family member." };
  if (!(/\.foreach\s*\(/i.test(answer) || /\bfor\b/.test(norm)))
    return { correct: false, feedback: "Use forEach (or a for loop) to iterate over each person's children." };
  if (!/\.concat\s*\(|names\s*=.*names|push\s*\(/i.test(answer))
    return { correct: false, feedback: "Accumulate all names — use concat() or push() to collect names from each recursive call." };
  if (!/\.length/.test(answer))
    return { correct: false, feedback: "Log the family size using .length on the names array." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to print the family size and names." };
  return { correct: true, feedback: "Correct! The family has 9 members: Mary, John, Amina, Jessica, Luca, Sarah, Mike, Maria, Jim." };
};

// ── cf9-c: Playing with scopes ────────────────────────────────────────────────
// var → prints "value: 3" three times. let → prints 0, 1, 2.

// This is a prose answer, so nothing here can be proved wrong by matching —
// every rule is advisory. Notably there is no "closure" rule: the prompt asks
// what the code prints and why, and never introduces the term.

const cf9c: Checker = (answer) => {
  const norm = answer.toLowerCase();

  // The var half: prints 3 each time.
  const saysThree = /\b3\b/.test(answer);
  const saysRepeated = /three times|3 times|each time|every time|all three|same value/i.test(answer);
  if (!saysThree || !saysRepeated)
    return hint("What does the var version print, and how many times? (hint: all three callbacks fire after the loop has ended)");

  const explainsVar =
    /function[ -]scope|not block[ -]scope|shared|same i\b|one i\b|single i\b|already.*(incremented|finished)|after the loop/i.test(norm);
  if (!explainsVar)
    return hint("Explain why var gives the same value each time — the callbacks all refer to one shared i, because var isn't block-scoped.");

  // The let half: prints 0, 1, 2.
  if (!/0[\s,]+1[\s,]+2|value:\s*0/i.test(answer))
    return hint("What does the let version print? Walk through what each of the three callbacks logs.");

  const explainsLet = /block[ -]scope|each iteration|per iteration|its own|new i\b|fresh|copy|preserved/i.test(norm);
  if (!explainsLet)
    return hint("Explain why let behaves differently — what does each iteration of the loop get?");

  return pass("Correct — that's exactly right for both loops.");
};

// ── cf9-d: Improve the code ───────────────────────────────────────────────────
// Replace var with let; count leaks out of for block, i leaks out of function.

// Answers here are prose + code ("how would you improve..."), and students
// reasonably quote the original or write the word "var" while explaining the
// change. So the presence of `var` can't be a hard fail — only the absence of
// the fix is checked strictly.

const cf9d: Checker = (answer) => {
  if (!/let\s+count\b/i.test(answer))
    return fail("Declare count with let inside the function (before the for loop).");
  if (!/let\s+i\b/i.test(answer))
    return fail("Declare i with let instead of var.");
  if (!/console\.log\s*\(\s*counter\s*\(\s*\)\s*\)/i.test(answer))
    return fail("Keep console.log(counter()) to verify the function still works.");

  // Still worth flagging a leftover `var x =` declaration, but gently — it may
  // just be the "before" half of a before/after answer.
  if (/\bvar\s+[a-z_$][\w$]*\s*=/i.test(answer))
    return hint("There's still a var declaration in your answer — if that's the original code you're comparing against, ignore this.");

  return pass();
};

// ── cf9-e: Fix the code ───────────────────────────────────────────────────────
// Problem: let num = 3 causes TDZ error when num += 1 runs above it.
// Fix: either remove let num = 3 (use outer num), or move it before num += 1.

// Two fixes are valid, and the exercise accepts either:
//   (a) move `let num = 3` above `num += 1`   → Inner 4, Outer 2, Global 1
//   (b) drop `let num = 3` and use the outer num → Inner 3, Outer 3, Global 1
// The old checker demanded (a) and rejected (b), and required the two lines to
// sit within 20 characters of each other.

const cf9e: Checker = (answer) => {
  if (!/function\s+inner/i.test(answer))
    return fail("Keep the inner() function — only fix the variable declaration inside it.");
  if ((answer.match(/console\.log/g) ?? []).length < 3)
    return fail("Keep all three console.log statements — Inner num, Outer num, and Global num.");

  const declIdx = answer.search(/let\s+num\s*=\s*3/i);
  if (declIdx === -1) {
    // Fix (b): the inner declaration is gone entirely.
    if (!/num\s*\+=\s*1/i.test(answer))
      return fail("Keep num += 1 inside inner() — the exercise is about where num is declared, not about removing the increment.");
    return pass("Correct! Using the outer num gives: Inner num: 3, Outer num: 3, Global num: 1.");
  }

  // Fix (a): the declaration must come before the increment. Compare the LAST
  // occurrence of each, so pasting the original code above the fix still works.
  const lastIndexOf = (re: RegExp) => {
    const matches = [...answer.matchAll(new RegExp(re.source, re.flags + "g"))];
    return matches.length ? matches[matches.length - 1].index : -1;
  };
  const lastDecl = lastIndexOf(/let\s+num\s*=\s*3/i);
  const lastInc = lastIndexOf(/num\s*\+=\s*1/i);
  if (lastInc !== -1 && lastInc < lastDecl)
    return hint("Check the order inside inner() — num += 1 still runs before let num = 3 is declared, which throws. If that's the original code you're comparing against, ignore this.");

  return pass("Correct! Inner num: 4, Outer num: 2, Global num: 1.");
};

// ── cf10-c: DOM manipulation ──────────────────────────────────────────────────
// Must log title, change title, change background colour.

const cf10c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/document\.title/i.test(answer) || !/console\.log/i.test(answer))
    return fail("Log the current page title with console.log(document.title).");
  if (!/document\.title\s*=\s*["'`]/.test(answer))
    return fail("Change the page title by assigning a new string to document.title.");
  if (!/document\.body\.style\.(backgroundcolor|background)\s*=/i.test(norm))
    return fail('Change the background colour with document.body.style.backgroundColor = "lightblue" (or any colour).');
  if (!/<script[\s>]/i.test(answer) || !/<\/script>/i.test(answer))
    return fail("Wrap your JavaScript inside a <script> tag in the HTML file.");
  return pass();
};

// ── cf11-d: I see you! ────────────────────────────────────────────────────────
// Must add mouseover/mouseenter and mouseleave/mouseout event listeners.

const cf11d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/<p[\s>]/i.test(answer))
    return { correct: false, feedback: "Add a <p> element to your HTML with the initial text \"Hello\"." };
  if (!/hello/i.test(answer))
    return { correct: false, feedback: "Set the initial text of the paragraph to \"Hello\"." };
  if (!/getelementbyid|queryselector/i.test(answer))
    return { correct: false, feedback: "Select the paragraph using getElementById() or querySelector()." };
  if (!/addeventlistener/i.test(answer))
    return { correct: false, feedback: "Use addEventListener() to attach the mouse events." };
  if (!/mouseenter|mouseover/i.test(answer))
    return { correct: false, feedback: "Listen for the \"mouseenter\" (or \"mouseover\") event to detect when the mouse hovers." };
  if (!/i see you/i.test(answer))
    return { correct: false, feedback: "Set the paragraph text to \"I see you!\" in the mouseenter handler." };
  if (!/mouseleave|mouseout/i.test(answer))
    return { correct: false, feedback: "Listen for the \"mouseleave\" (or \"mouseout\") event to detect when the mouse leaves." };
  if (!/where did you go/i.test(answer))
    return { correct: false, feedback: "Set the paragraph text to \"Where did you go?\" in the mouseleave handler." };
  if (!/textcontent|innertext|innerhtml/i.test(answer))
    return { correct: false, feedback: "Update the paragraph text using textContent (or innerText)." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf12-c: The ATM simulator ─────────────────────────────────────────────────
// Must use try/catch/finally; finally ejects card; checks balance; updates balance.

const cf12c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\btry\b/.test(norm))
    return { correct: false, feedback: "Wrap the withdrawal logic in a try block." };
  if (!/\bcatch\s*\(\s*\w+\s*\)/.test(answer))
    return { correct: false, feedback: "Add a catch(error) block to handle the error and log error.message." };
  if (!/\bfinally\b/.test(norm))
    return { correct: false, feedback: "Add a finally block — the card must always be ejected, whether the withdrawal succeeds or fails." };
  if (!/eject/i.test(answer))
    return { correct: false, feedback: "Log a card ejection message inside the finally block (e.g. \"Card ejected.\")." };
  if (!/throw\s+new\s+Error/i.test(answer))
    return { correct: false, feedback: "Use throw new Error(...) to throw an error when the amount exceeds the balance." };
  if (!/amount\s*>\s*accountbalance|accountbalance\s*<\s*amount/i.test(answer))
    return { correct: false, feedback: "Check if amount > accountBalance before throwing the error." };
  if (!/accountbalance\s*-=\s*amount|accountbalance\s*=\s*accountbalance\s*-\s*amount/i.test(answer))
    return { correct: false, feedback: "Deduct the amount from accountBalance on a successful withdrawal (accountBalance -= amount)." };
  if (!/withdrawmoney\s*\(\s*50\s*\)/i.test(answer) || !/withdrawmoney\s*\(\s*200\s*\)/i.test(answer))
    return { correct: false, feedback: "Keep both test cases: withdrawMoney(50) and withdrawMoney(200)." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf13-h: OOP in action ─────────────────────────────────────────────────────
// Must define iPhone and Samsung classes; useApp and chargeBattery methods; battery tracking.

// The prompt asks for two smartphone types sharing the same interface. It does
// NOT ask for inheritance, so two independent classes are a valid answer and
// must not be rejected. A shared base class is still accepted (and nudged for).

const cf13h: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bclass\b/.test(norm))
    return fail("Use the class keyword to define your smartphone classes.");
  if (!/iphone/i.test(answer) || !/samsung/i.test(answer))
    return fail("Define both an IPhone class and a Samsung class.");
  if (!/useapp\s*\(/i.test(answer))
    return fail("Add a useApp(appName) method that reduces battery by the drain amount.");
  if (!/chargebattery\s*\(/i.test(answer))
    return fail("Add a chargeBattery() method that resets battery back to 100.");
  if (!/battery\s*=\s*100/i.test(answer))
    return fail("The battery should start at 100% and chargeBattery() should reset it to 100.");

  const deducts = /battery\s*-=|battery\s*=\s*.*battery\s*-/i.test(answer);
  if (!deducts)
    return fail("Deduct the drain amount from battery in useApp().");

  // 10% for iPhone, 5% for Samsung — via super(10)/super(5) or written directly
  // into each class, both fine.
  if (!/\b10\b/.test(answer))
    return fail("The iPhone drains 10% of battery per use — that 10 needs to appear somewhere.");
  if (!/\b5\b/.test(answer))
    return fail("The Samsung drains 5% of battery per use — that 5 needs to appear somewhere.");

  if (!/\bextends\b/.test(norm))
    return hint("This works. As a refinement: both phones share the same interface, so you could pull the common parts into a base class and use extends — worth trying if you want to practise inheritance.");

  return pass();
};

// ── cf14-b: Removing duplicates ───────────────────────────────────────────────
// Must use new Set() on the colors array.

const cf14b: Checker = (answer) => {
  if (!/new\s+Set\s*\(\s*colors\s*\)/i.test(answer))
    return { correct: false, feedback: "Pass the colors array directly into new Set(): new Set(colors)." };
  if (!/console\.log/.test(answer))
    return { correct: false, feedback: "Use console.log() to print the result." };
  return { correct: true, feedback: "Correct! The unique colours are: blue, orange, yellow, green." };
};

// ── cf14-d: Fibonacci with Map cache ─────────────────────────────────────────
// Must use a Map to cache results, checking the cache before computing.
// (The section is specifically teaching Map, so Map is required here.)

const cf14d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/new\s+Map\s*\(\s*\)/.test(answer))
    return fail("Create a cache using new Map().");
  if (!/cache\.has\s*\(\s*n\s*\)|\.has\s*\(\s*n\s*\)/i.test(answer))
    return { correct: false, feedback: "Check if the result is already cached using cache.has(n) before computing." };
  if (!/cache\.get\s*\(\s*n\s*\)|\.get\s*\(\s*n\s*\)/i.test(answer))
    return { correct: false, feedback: "Return the cached value using cache.get(n) when it exists." };
  if (!/cache\.set\s*\(\s*n\s*,|\.set\s*\(\s*n\s*,/i.test(answer))
    return { correct: false, feedback: "Store the computed result using cache.set(n, result)." };
  if (!/console\.time/i.test(answer))
    return { correct: false, feedback: "Keep the console.time() and console.timeEnd() calls to verify the speed improvement." };
  if (!/calculatefibonacci\s*\(\s*35\s*\)/i.test(answer))
    return { correct: false, feedback: "Test with calculateFibonacci(35) to verify the performance." };
  return { correct: true, feedback: "Correct! With caching the result should now compute in under 1ms." };
};

// ── cf14-f: Old to new (arrow functions) ─────────────────────────────────────
// Must rewrite hello, applyDiscount, checkStock as arrow functions.

const cf14f: Checker = (answer) => {
  if (!/=>/.test(answer))
    return { correct: false, feedback: "Use arrow function syntax (=>) for all three functions." };
  if (!/const\s+hello\s*=/i.test(answer))
    return { correct: false, feedback: "Rewrite hello as a const arrow function: const hello = () => ..." };
  if (!/const\s+applyDiscount\s*=/i.test(answer))
    return { correct: false, feedback: "Rewrite applyDiscount as a const arrow function: const applyDiscount = (price, discount) => ..." };
  if (!/const\s+checkStock\s*=/i.test(answer))
    return { correct: false, feedback: "Rewrite checkStock as a const arrow function: const checkStock = (quantity) => ..." };
  // Catches both `function hello()` and `const hello = function ()`.
  if (/\bfunction\s+(hello|applyDiscount|checkStock)\b/i.test(answer) || /\bfunction\s*\(/.test(answer))
    return fail("Remove the function keyword — all three should use const name = (...) => syntax.");
  return pass();
};

// ── cf14-h: The kitchen manager ───────────────────────────────────────────────
// Must use spread and rest; define sendDelivery and order functions.

const cf14h: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/function\s+sendDelivery\s*\([^)]*\.\.\./i.test(answer) && !/sendDelivery\s*=\s*\([^)]*\.\.\./i.test(answer))
    return { correct: false, feedback: "Define sendDelivery with a rest parameter: function sendDelivery(specialIngredient, ...optionals)." };
  if (!/function\s+order\s*\([^)]*\.\.\./i.test(answer) && !/order\s*=\s*\([^)]*\.\.\./i.test(answer))
    return { correct: false, feedback: "Define order with a rest parameter: function order(mainComponent, specialIngredient, ...optionals)." };
  if (!/\[\s*\w+\s*,\s*\.\.\.\w+\s*\]|\[\s*\.\.\.\w+\s*\]/i.test(answer))
    return { correct: false, feedback: "Use spread syntax to combine ingredients into an array (e.g. [specialIngredient, ...optionals])." };
  if (!/maincomponents\.includes|specialingredients\.includes|optionalingredients\.includes/i.test(answer))
    return { correct: false, feedback: "Validate each part of the order using .includes() against the collections." };
  if (!/order invalid|not available/i.test(answer))
    return { correct: false, feedback: "Return a user-friendly error message when an item is not available." };
  if (!/order submitted/i.test(answer))
    return { correct: false, feedback: "Return a success message (e.g. \"Order submitted\") when the order is valid." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() with the provided test cases." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf14-j: Extractor ─────────────────────────────────────────────────────────
// Must destructure label, price, color (nested), reviews from product.

const cf14j: Checker = (answer) => {
  const norm = answer.toLowerCase();
  // [^}]+ used to stop at the first closing brace, so the nested `specs: { color }`
  // destructuring this exercise actually asks for never matched. Allow one level
  // of nesting.
  if (!/(const|let|var)\s*\{(?:[^{}]|\{[^{}]*\})*\}\s*=\s*product/i.test(answer))
    return fail("Use destructuring: const { label, price, ... } = product.");
  if (!/\blabel\b/.test(norm))
    return { correct: false, feedback: "Extract the label property from product." };
  if (!/\bprice\b/.test(norm))
    return { correct: false, feedback: "Extract the price property from product." };
  if (!/specs\s*:\s*\{\s*color\b|\bcolor\b.*=.*specs|const\s*\{\s*color\b/i.test(answer))
    return { correct: false, feedback: "Extract color using nested destructuring: specs: { color } inside the main destructuring." };
  if (!/\breviews\b/.test(norm))
    return { correct: false, feedback: "Extract the reviews array from product." };
  if ((answer.match(/console\.log/g) ?? []).length < 2)
    return { correct: false, feedback: "Use console.log() to print each extracted value." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf14-l: Templates ─────────────────────────────────────────────────────────
// Must use a template literal with ${} to produce the target sentence.

const cf14l: Checker = (answer) => {
  if (!/`[^`]*\$\{[^`]*`/.test(answer))
    return { correct: false, feedback: "Use a template literal (backticks) with ${} interpolation to build the string." };
  if (!/\$\{\s*firstName\s*\}/i.test(answer))
    return { correct: false, feedback: "Interpolate firstName using ${firstName}." };
  if (!/\$\{\s*role\s*\}/i.test(answer))
    return { correct: false, feedback: "Interpolate role using ${role}." };
  if (!/\$\{\s*yearsExperience\s*\}/i.test(answer))
    return { correct: false, feedback: "Interpolate yearsExperience using ${yearsExperience}." };
  // [\s\S] rather than . so a template literal spanning lines still matches.
  if (!/is a[\s\S]*with[\s\S]*years of experience/i.test(answer))
    return fail('The output should read: "Joana is a Developer with 5 years of experience."');
  if (!/console\.log/.test(answer))
    return { correct: false, feedback: "Use console.log() to print the result." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf15-b: At the restaurant (with Callbacks) ────────────────────────────────
// Must replace the CPU-blocking while loop with setTimeout; chain courses via callbacks.

const cf15b: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (/while\s*\([^)]*date\.now/i.test(answer))
    return { correct: false, feedback: "Remove the CPU-blocking while loop — replace it with setTimeout." };
  if (!/settimeout/i.test(answer))
    return { correct: false, feedback: "Use setTimeout() inside prepareFood to simulate the cooking delay asynchronously." };
  if (!/function\s+prepareFood\s*\([^)]*callback/i.test(answer) && !/prepareFood\s*=\s*\([^)]*callback/i.test(answer))
    return { correct: false, feedback: "Add a callback parameter to prepareFood(orderItem, timeMs, callback) and call it after the food is ready." };
  if (!/if\s*\(\s*callback\s*\)\s*callback\s*\(\)|callback\s*&&\s*callback\s*\(\)|callback\s*\(\)/i.test(answer))
    return { correct: false, feedback: "Call the callback inside the setTimeout after logging that the food is ready." };
  if (!/preparefood\s*\("drink"/i.test(answer))
    return { correct: false, feedback: "Start the chain by calling prepareFood(\"Drink\", ...) with a callback that calls the next course." };
  if (!/taking order for table a|table a/i.test(answer))
    return { correct: false, feedback: "Keep the console.log messages to verify the correct async order." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf15-d: At the restaurant (with Promises) ─────────────────────────────────
// Must use new Promise() and .then() chaining.

const cf15d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/new\s+Promise\s*\(\s*\(\s*resolve/i.test(answer))
    return { correct: false, feedback: "Return a new Promise((resolve) => ...) from prepareFood and call resolve() inside setTimeout when the food is ready." };
  // Accept an inline arrow, an inline function, or a function reference.
  if (!/\.then\s*\(\s*[^)]/i.test(answer))
    return fail("Chain the courses using .then(() => prepareFood(...)).");
  if ((answer.match(/\.then\s*\(/g) ?? []).length < 3)
    return { correct: false, feedback: "Chain all three courses with .then() — Drink, Pizza, and Dessert." };
  if (!/all courses served/i.test(answer))
    return { correct: false, feedback: "Log \"All courses served to Table A!\" in the final .then()." };
  if (!/taking order for table a|table a/i.test(answer))
    return { correct: false, feedback: "Keep the console.log messages to verify the correct async order." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf15-f: At the restaurant (with Async and Await) ──────────────────────────
// Must use async function and await.

const cf15f: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/async\s+function\s+\w+|const\s+\w+\s*=\s*async/i.test(answer))
    return { correct: false, feedback: "Define an async function (e.g. async function serveTableA()) to contain the await calls." };
  if ((answer.match(/\bawait\b/g) ?? []).length < 3)
    return { correct: false, feedback: "Use await before each prepareFood() call — one for Drink, Pizza, and Dessert." };
  if (!/new\s+Promise\s*\(\s*\(\s*resolve/i.test(answer))
    return { correct: false, feedback: "prepareFood still needs to return a Promise — keep the new Promise((resolve) => ...) wrapping setTimeout." };
  if (!/all courses served/i.test(answer))
    return { correct: false, feedback: "Log \"All courses served to Table A!\" after the last await." };
  if (!/taking order for table a|table a/i.test(answer))
    return { correct: false, feedback: "Keep the console.log messages to verify the correct async order." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf16-c: Weather forecast at home ─────────────────────────────────────────
// Must use fetch(), reference ip-api or similar, reference open-meteo, compute Accurate.

const cf16c: Checker = (answer) => {
  if ((answer.match(/fetch\s*\(/g) ?? []).length < 2)
    return fail("You need two fetch() calls — one to get your location, and one to get the weather from open-meteo.");
  // The prompt names open-meteo directly, but only offers ip-api as an example
  // ("an open online service, like ip-api.com/json"), so any geolocation
  // service is acceptable.
  if (!/open-meteo\.com/i.test(answer))
    return fail("Use the open-meteo API (api.open-meteo.com/v1/forecast) to get the weather for your coordinates.");
  if (!/\b(lat|latitude)\b/i.test(answer) || !/\b(lon|longitude)\b/i.test(answer))
    return fail("Get lat and lon from the location response and pass them to the open-meteo URL.");
  if (!/current_weather/i.test(answer))
    return fail("Add current_weather=true to the open-meteo URL and access data.current_weather in the response.");
  if (!/\baccurate\b/i.test(answer))
    return fail("Add an accurate field, set to true if the weather data is less than 60 minutes old.");
  if (!/\b60\b/.test(answer))
    return hint("Compare the age of the weather record against 60 minutes to work out the accurate flag.");
  return pass();
};

// ── Registry ─────────────────────────────────────────────────────────────────

// Exercises whose answers are not plain JavaScript, and so must skip the
// syntax gate: prose explanations, HTML pages, and prose+code mixtures where
// students are asked to describe a change rather than only write it.
const NON_JS_ANSWERS = new Set([
  "cf1-c",  // reorder the algorithm — prose/numbered list
  "cf2-c",  // Hello World in the browser — HTML
  "cf8-f",  // tracking the execution flow — pen-and-paper trace
  "cf9-c",  // playing with scopes — prose explanation
  "cf9-d",  // improve the code — prose + code
  "cf9-e",  // fix the code — prose + code, and the bug is a runtime error anyway
  "cf10-c", // DOM manipulation — HTML
  "cf11-d", // I see you! — HTML
]);

/** Every code exercise gets the syntax gate before its own rules run. */
function withSyntaxGate(id: string, checker: Checker): Checker {
  if (NON_JS_ANSWERS.has(id)) return checker;
  return (answer) => checkJsSyntax(answer) ?? checker(answer);
}

const RAW_CHECKERS: Record<string, Checker> = {
  "cf1-c": cf1c,
  "cf2-b": cf2b,
  "cf2-c": cf2c,
  "cf3-c": cf3c,
  "cf3-d": cf3d,
  "cf4-c": cf4c,
  "cf4-d": cf4d,
  "cf5-b": cf5b,
  "cf5-e": cf5e,
  "cf6-c": cf6c,
  "cf6-f": cf6f,
  "cf7-c": cf7c,
  "cf7-d": cf7d,
  "cf7-g": cf7g,
  "cf7-j": cf7j,
  "cf7-m": cf7m,
  "cf8-c": cf8c,
  "cf8-f": cf8f,
  "cf8-g": cf8g,
  "cf9-c": cf9c,
  "cf9-d": cf9d,
  "cf9-e": cf9e,
  "cf10-c": cf10c,
  "cf11-d": cf11d,
  "cf12-c": cf12c,
  "cf13-h": cf13h,
  "cf14-b": cf14b,
  "cf14-d": cf14d,
  "cf14-f": cf14f,
  "cf14-h": cf14h,
  "cf14-j": cf14j,
  "cf14-l": cf14l,
  "cf15-b": cf15b,
  "cf15-d": cf15d,
  "cf15-f": cf15f,
  "cf16-c": cf16c,
};

export const EXERCISE_CHECKERS: Record<string, Checker> = Object.fromEntries(
  Object.entries(RAW_CHECKERS).map(([id, checker]) => [id, withSyntaxGate(id, checker)]),
);
