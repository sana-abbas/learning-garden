// Auto-checkers for exercise subtasks.
// Each checker takes the student's pasted answer and returns a result.
// Keyed by subtask ID.

export interface CheckResult {
  correct: boolean;
  feedback: string;
}

type Checker = (answer: string) => CheckResult;

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
    return { correct: false, feedback: `Found ${nums.length} numbers — make sure to include all 10 steps.` };
  }
  const seq = nums.slice(0, 10);
  const wrong = seq.findIndex((n, i) => n !== CF1C_CORRECT[i]);
  if (wrong === -1) {
    return { correct: true, feedback: "Correct! That's the right order." };
  }
  return {
    correct: false,
    feedback: `Position ${wrong + 1} looks off — got step ${seq[wrong]}, expected step ${CF1C_CORRECT[wrong]}.`,
  };
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
  if (detected.length < 5) {
    return { correct: false, feedback: "Couldn't recognise enough steps. Try numbering your answer (e.g. 2, 1, 8…) or write the steps more clearly." };
  }
  // Compare recognised order against correct
  const correctSubset = CF1C_CORRECT.filter((n) => detected.includes(n));
  const matches = detected.every((n, i) => n === correctSubset[i]);
  if (matches && detected.length >= 8) {
    return { correct: true, feedback: "Correct! That's the right order." };
  }
  const wrongPos = detected.findIndex((n, i) => n !== correctSubset[i]);
  return {
    correct: false,
    feedback: wrongPos === -1
      ? "Almost — make sure you've included all 10 steps in the correct order."
      : `Step "${CF1C_KEYWORDS[detected[wrongPos] - 1][0]}" seems to be in the wrong position.`,
  };
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

const cf2b: Checker = (answer) => {
  const norm = answer.trim().replace(/\s+/g, " ");
  const hasLog = /console\.log\s*\(\s*["']Hello World!["']\s*\)/.test(norm);
  if (hasLog) return { correct: true, feedback: "Correct!" };
  if (norm.toLowerCase().includes("console.log"))
    return { correct: false, feedback: 'Close — check the exact string: it should be "Hello World!" (capital H and W, with exclamation mark).' };
  return { correct: false, feedback: 'Use console.log() to print the message.' };
};

// ── cf2-c: Hello, World! in the web browser ──────────────────────────────────
// Solution: <script>console.log("Hello World!");</script>

const cf2c: Checker = (answer) => {
  const norm = answer.trim().replace(/\s+/g, " ");
  const hasScript = /<script[\s>]/i.test(norm) && /<\/script>/i.test(norm);
  const hasLog = /console\.log\s*\(\s*["']Hello World!["']\s*\)/.test(norm);
  if (hasScript && hasLog) return { correct: true, feedback: "Correct!" };
  if (!hasScript)
    return { correct: false, feedback: 'Wrap your code in a <script>...</script> tag.' };
  if (!hasLog)
    return { correct: false, feedback: 'Add console.log("Hello World!") inside your script tag.' };
  return { correct: false, feedback: 'Check that the message is exactly "Hello World!".' };
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

  if (!hasLet) return { correct: false, feedback: "Declare at least one variable using let." };
  if (!hasConst) return { correct: false, feedback: "Declare at least one variable using const." };
  if (!hasReassign) return { correct: false, feedback: "Make sure you reassign a variable after its initial declaration." };
  if (!hasLog) return { correct: false, feedback: "Use console.log() to print the values." };
  return { correct: true, feedback: "Correct!" };
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
    return { correct: false, feedback: "Use the typeof operator to check data types." };

  const found = CF3D_TYPES.filter(([, re]) => re.test(answer)).map(([name]) => name);
  if (found.length >= 5) return { correct: true, feedback: "Correct!" };

  const missing = CF3D_TYPES.map(([name]) => name).filter((n) => !found.includes(n));
  return {
    correct: false,
    feedback: `Good start — also test these types: ${missing.join(", ")}.`,
  };
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
  { expr: /true\s*\|\|\s*false/, result: /=+\s*true/, label: "true || false → true" },
  { expr: /!false/, result: /=+\s*true/, label: "!false → true" },
];

const cf4c: Checker = (answer) => {
  if (!/console\.log/.test(answer))
    return { correct: false, feedback: "Use console.log() to print each result." };

  const wrong = CF4C_CHECKS.filter(({ expr, result }) => {
    const match = answer.match(expr);
    if (!match) return false; // expression not found — skip
    const afterExpr = answer.slice(answer.search(expr) + match[0].length);
    return !result.test(afterExpr.slice(0, 20));
  });

  if (wrong.length === 0) return { correct: true, feedback: "Correct!" };
  return {
    correct: false,
    feedback: `Check the result for: ${wrong.map((w) => w.label).join(", ")}.`,
  };
};

// ── cf4-d: Find the operator for the given result ─────────────────────────────
// Correct operators: +, *, /, ==, >, &&/!

const CF4D_CHECKS: Array<{ expr: RegExp; label: string }> = [
  { expr: /6\s*\+\s*4/,          label: "6 + 4 = 10" },
  { expr: /5\s*\*\s*5/,          label: "5 * 5 = 25" },
  { expr: /24\s*\/\s*8/,         label: "24 / 8 = 3" },
  { expr: /12\s*={1,2}\s*["']12["']/, label: '12 == "12"' },
  { expr: /9\s*>\s*4/,           label: "9 > 4" },
  { expr: /!false\s*&&\s*!false/, label: "!false && !false" },
];

const cf4d: Checker = (answer) => {
  if (!/console\.log/.test(answer))
    return { correct: false, feedback: "Use console.log() to print each result." };

  const missing = CF4D_CHECKS.filter(({ expr }) => !expr.test(answer));
  if (missing.length === 0) return { correct: true, feedback: "Correct!" };
  return {
    correct: false,
    feedback: `Missing or incorrect operator for: ${missing.map((m) => m.label).join(", ")}.`,
  };
};

// ── cf5-b: Check the number ───────────────────────────────────────────────────
// Must use if / else if / else and log a message for positive, negative, zero.

const cf5b: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bif\b/.test(norm))
    return { correct: false, feedback: "Use an if statement to check the number." };
  if (!/else\s+if\b/.test(norm))
    return { correct: false, feedback: "Use else if to handle all three cases: positive, negative, and zero." };
  if (!/\belse\b/.test(norm))
    return { correct: false, feedback: "Add an else branch to handle the zero case." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to print the result." };

  const hasPositive = />\s*0/.test(answer);
  const hasNegative = /<\s*0/.test(answer);
  if (!hasPositive || !hasNegative)
    return { correct: false, feedback: "Check your conditions — you need to compare n > 0 and n < 0." };

  return { correct: true, feedback: "Correct!" };
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
    return { correct: false, feedback: "Use a switch statement." };
  if (!/\bdefault\b/.test(norm))
    return { correct: false, feedback: "Add a default case for invalid month values." };
  if (!/\bbreak\b/.test(norm))
    return { correct: false, feedback: "Add break statements to prevent fall-through." };

  const missingSeason = CF5E_SEASONS.find(({ name }) => !norm.includes(name));
  if (missingSeason)
    return { correct: false, feedback: `Missing season: "${missingSeason.name}".` };

  const missingMonth = CF5E_SEASONS.flatMap(({ months }) => months)
    .find((m) => !new RegExp(`\\bcase\\s+${m}\\b`).test(norm));
  if (missingMonth !== undefined)
    return { correct: false, feedback: `Missing case for month ${missingMonth}.` };

  if (!/(console\.log|season\s*=)/.test(norm))
    return { correct: false, feedback: "Log the season or assign it to a variable." };

  return { correct: true, feedback: "Correct!" };
};

// ── cf6-c: Invert the number ──────────────────────────────────────────────────
// Must use a while loop, extract digits with % 10, and truncate with Math.floor.

const cf6c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bwhile\b/.test(norm))
    return { correct: false, feedback: "Use a while loop to reverse the number." };
  if (!/%\s*10/.test(answer))
    return { correct: false, feedback: "Use % 10 to extract the last digit." };
  if (!/math\.floor/i.test(answer))
    return { correct: false, feedback: "Use Math.floor() to remove the last digit after each iteration." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to print the reversed number." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf6-f: Sum up the numbers ─────────────────────────────────────────────────
// Must use a for loop summing 1 to 10 (result: 55).

const cf6f: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bfor\b/.test(norm))
    return { correct: false, feedback: "Use a for loop to iterate over the numbers." };
  if (!/i\s*<=\s*10|i\s*<\s*11/.test(answer))
    return { correct: false, feedback: "Make sure your loop runs up to and including 10." };
  if (!(/\+=/.test(answer) || /total\s*=\s*total\s*\+/.test(norm) || /sum\s*=\s*sum\s*\+/.test(norm)))
    return { correct: false, feedback: "Accumulate the sum inside the loop (e.g. total += i)." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to print the result." };
  return { correct: true, feedback: "Correct! The sum of 1 to 10 is 55." };
};

// ── cf7-c: Filter the numbers ─────────────────────────────────────────────────
// Must use filter() with a % 2 even check.

const cf7c: Checker = (answer) => {
  if (!/\.filter\s*\(/.test(answer))
    return { correct: false, feedback: "Use the filter() method on your array." };
  if (!/%\s*2/.test(answer))
    return { correct: false, feedback: "Use % 2 inside filter() to check for even numbers." };
  if (!/console\.log/.test(answer))
    return { correct: false, feedback: "Use console.log() to print the result." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf7-d: Map the adults of the family ──────────────────────────────────────
// Must traverse nested array, check age >= 18, collect names.

const cf7d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!(/\bwhile\b/.test(norm) || /\bfor\b/.test(norm)))
    return { correct: false, feedback: "Use a loop to traverse the family array." };
  if (!/>=\s*18|18\s*<=/.test(answer))
    return { correct: false, feedback: "Check age >= 18 to determine if someone is an adult." };
  if (!/\.shift\(\)|\.push\(/.test(answer))
    return { correct: false, feedback: "Use push() and shift() (or similar) to process the family list." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to print the adults." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf7-g: Web browser navigation ────────────────────────────────────────────
// Must use two stacks with push/pop, handle back/forward, clear forward on new visit.

const cf7g: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\.push\s*\(/.test(answer))
    return { correct: false, feedback: "Use push() to add pages to your stack(s)." };
  if (!/\.pop\s*\(\)/.test(answer))
    return { correct: false, feedback: "Use pop() to go back/forward in your stack." };
  if ((answer.match(/\[\s*\]/g) ?? []).length < 2)
    return { correct: false, feedback: "Use two separate stacks — one for back history and one for forward history." };
  if (!/forwardStack\s*=\s*\[\]|forward\w*\s*=\s*\[\]/i.test(answer))
    return { correct: false, feedback: "Clear the forward stack when visiting a new page." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to log each page visited." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf7-j: Printer queue ──────────────────────────────────────────────────────
// Must use push() and shift() to simulate FIFO queue.

const cf7j: Checker = (answer) => {
  if (!/\.shift\s*\(\)/.test(answer))
    return { correct: false, feedback: "Use shift() to remove and print the first file in the queue (FIFO)." };
  if (!/\.push\s*\(/.test(answer))
    return { correct: false, feedback: "Use push() to add the new file to the queue." };
  if (!/Statistics_data/.test(answer))
    return { correct: false, feedback: "Make sure to add Statistics_data.json to the queue after the first file is printed." };
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
  if ((norm.match(/\bisavailable\b/g) ?? []).length < 3)
    return { correct: false, feedback: "Update isAvailable when the book is borrowed and returned." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to log each step." };
  return { correct: true, feedback: "Correct!" };
};

// ── Registry ─────────────────────────────────────────────────────────────────

export const EXERCISE_CHECKERS: Record<string, Checker> = {
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
};
