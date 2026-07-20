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
  const hasLog = /console\.log\s*\(\s*["']hello world!["']\s*\)/i.test(norm);
  if (hasLog) return { correct: true, feedback: "Correct!" };
  if (norm.toLowerCase().includes("console.log"))
    return { correct: false, feedback: 'Close — make sure the message is "Hello World!" with an exclamation mark.' };
  return { correct: false, feedback: 'Use console.log() to print the message.' };
};

// ── cf2-c: Hello, World! in the web browser ──────────────────────────────────
// Solution: <script>console.log("Hello World!");</script>

const cf2c: Checker = (answer) => {
  const norm = answer.trim().replace(/\s+/g, " ");
  const hasScript = /<script[\s>]/i.test(norm) && /<\/script>/i.test(norm);
  const hasLog = /console\.log\s*\(\s*["']hello world!["']\s*\)/i.test(norm);
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

// ── cf8-c: Write the rice recipe in JavaScript ────────────────────────────────
// Must define cookRice(amountOfRice), use functions, loops, conditionals, console.log.

const cf8c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/function\s+cookrice\s*\(/i.test(answer))
    return { correct: false, feedback: "Define a main function called cookRice(amountOfRice)." };
  if ((answer.match(/\bfunction\b/gi) ?? []).length < 2)
    return { correct: false, feedback: "Break the recipe into smaller helper functions (e.g. prepareRice, rinseRice, simulateCooking...)." };
  if (!/simulatecooking|simulate/i.test(answer))
    return { correct: false, feedback: "Add a simulateCooking(minutes, heatLevel) helper function that uses a loop to simulate cooking time." };
  if (!/\bfor\b/.test(norm))
    return { correct: false, feedback: "Use a for loop inside simulateCooking to print each minute of cooking." };
  if (!/\bif\b/.test(norm))
    return { correct: false, feedback: "Use an if statement to check if the rice is still hard and cook for 2 more minutes if so." };
  if (!/console\.log/.test(norm))
    return { correct: false, feedback: "Use console.log() to print messages at each step." };
  if (!/cookrice\s*\(\d+\)/i.test(answer))
    return { correct: false, feedback: "Call cookRice() with an amount at the end (e.g. cookRice(100))." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf8-f: Tracking the execution flow ───────────────────────────────────────
// myFunction(6) = 6 + myFunction(4) = 6 + 4 + myFunction(2) = 6 + 4 + 2 + myFunction(0)
// myFunction(0): n<=1 → return 1. Result = 6+4+2+1 = 13.

const cf8f: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/13/.test(answer))
    return { correct: false, feedback: "The final result is not 13. Trace each call: myFunction(6) → myFunction(4) → myFunction(2) → myFunction(0) returns 1, then add back up." };
  if (!/myfunction\s*\(\s*[024]\s*\)|myfunc.*[024]/i.test(answer))
    return { correct: false, feedback: "Show the full recursive trace — include myFunction(4), myFunction(2), and myFunction(0) in your working." };
  if (!/myfunction\s*\(\s*0\s*\)|n\s*<=\s*1|returns?\s*1/i.test(answer))
    return { correct: false, feedback: "Show the base case: myFunction(0) returns 1 because n <= 1." };
  return { correct: true, feedback: "Correct! finalResult = 13." };
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

const cf9c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/value:\s*3|"value: 3"|prints.*3.*three|three.*3/i.test(answer))
    return { correct: false, feedback: "What does the var version print? (hint: all three callbacks fire after the loop ends)" };
  if (!/three times|3 times|value: 3.*value: 3|same.*value/i.test(answer))
    return { correct: false, feedback: "The var version prints \"value: 3\" three times — explain why it's the same value each time." };
  if (!/function scope|function-scope|var.*not block|not block.*var/i.test(norm) && !/shared.*i|i.*shared|same.*i\b/i.test(norm))
    return { correct: false, feedback: "Explain why var causes this — all callbacks share the same i because var is function-scoped, not block-scoped." };
  if (!/value: 0|value: 1|value: 2|0.*1.*2/i.test(answer))
    return { correct: false, feedback: "What does the let version print? It should print value: 0, value: 1, value: 2." };
  if (!/block scope|block-scope|new.*i.*each|each.*iteration|own.*i\b/i.test(norm))
    return { correct: false, feedback: "Explain why let behaves differently — each iteration gets its own i due to block scope." };
  if (!/closure/i.test(answer))
    return { correct: false, feedback: "Mention closure — each callback closes over its own i from that iteration." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf9-d: Improve the code ───────────────────────────────────────────────────
// Replace var with let; count leaks out of for block, i leaks out of function.

const cf9d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (/\bvar\b/.test(norm))
    return { correct: false, feedback: "Replace all var declarations with let." };
  if (!/\blet\b/.test(norm))
    return { correct: false, feedback: "Use let instead of var for both i and count." };
  if (!/let\s+count\b/i.test(answer))
    return { correct: false, feedback: "Declare count with let inside the function (before the for loop)." };
  if (!/let\s+i\b/i.test(answer))
    return { correct: false, feedback: "Declare i with let instead of var." };
  if (!/console\.log\s*\(\s*counter\s*\(\s*\)\s*\)/i.test(answer))
    return { correct: false, feedback: "Keep console.log(counter()) to verify the function still works." };
  return { correct: true, feedback: "Correct!" };
};

// ── cf9-e: Fix the code ───────────────────────────────────────────────────────
// Problem: let num = 3 causes TDZ error when num += 1 runs above it.
// Fix: either remove let num = 3 (use outer num), or move it before num += 1.

const cf9e: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/function\s+inner/i.test(answer))
    return { correct: false, feedback: "Keep the inner() function — only fix the variable declaration order inside it." };
  // The fix: let num = 3 must appear before num += 1
  if (/num\s*\+=\s*1[\s\S]{0,80}let\s+num\s*=\s*3/.test(answer))
    return { correct: false, feedback: "Move let num = 3 above num += 1 — you can't use a let variable before it's declared." };
  if (!/let\s+num\s*=\s*3[\s\S]{0,20}num\s*\+=\s*1/i.test(answer))
    return { correct: false, feedback: "Inside inner(), declare let num = 3 first, then num += 1 on the next line." };
  if ((answer.match(/console\.log/g) ?? []).length < 3)
    return { correct: false, feedback: "Keep all three console.log statements — Inner num, Outer num, and Global num." };
  return { correct: true, feedback: "Correct! Inner num: 4, Outer num: 2, Global num: 1." };
};

// ── cf10-c: DOM manipulation ──────────────────────────────────────────────────
// Must log title, change title, change background colour.

const cf10c: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/console\.log\s*\(\s*document\.title\s*\)/i.test(answer))
    return { correct: false, feedback: "Log the current page title with console.log(document.title)." };
  if (!/document\.title\s*=\s*["'`]/.test(answer))
    return { correct: false, feedback: "Change the page title by assigning a new string to document.title." };
  if (!/document\.body\.style\.backgroundcolor\s*=/i.test(norm))
    return { correct: false, feedback: "Change the background colour with document.body.style.backgroundColor = \"lightblue\" (or any colour)." };
  if (!/<script[\s>]/i.test(answer) || !/<\/script>/i.test(answer))
    return { correct: false, feedback: "Wrap your JavaScript inside a <script> tag in the HTML file." };
  return { correct: true, feedback: "Correct!" };
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

const cf13h: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/\bclass\b/.test(norm))
    return { correct: false, feedback: "Use the class keyword to define your smartphone classes." };
  if (!/\bextends\b/.test(norm))
    return { correct: false, feedback: "Have IPhone and Samsung extend a shared base Smartphone class." };
  if (!/\bsuper\s*\(/.test(answer))
    return { correct: false, feedback: "Call super() inside each subclass constructor to pass the drain value to the base class." };
  if (!/iphone/i.test(answer) || !/samsung/i.test(answer))
    return { correct: false, feedback: "Define both an IPhone class and a Samsung class." };
  if (!/useapp\s*\(/i.test(answer))
    return { correct: false, feedback: "Add a useApp(appName) method that reduces battery by the drain amount." };
  if (!/chargebattery\s*\(/i.test(answer))
    return { correct: false, feedback: "Add a chargeBattery() method that resets battery back to 100." };
  if (!/this\.battery\s*=\s*100/i.test(answer))
    return { correct: false, feedback: "Initialise battery to 100 in the constructor." };
  if (!/this\.battery\s*-=\s*this\.drain|this\.battery\s*-=\s*\d+/i.test(answer))
    return { correct: false, feedback: "Deduct the drain amount from battery in useApp()." };
  if (!/super\s*\(\s*10\s*\)/i.test(answer))
    return { correct: false, feedback: "IPhone should pass 10 to super() — it drains 10% per use." };
  if (!/super\s*\(\s*5\s*\)/i.test(answer))
    return { correct: false, feedback: "Samsung should pass 5 to super() — it drains 5% per use." };
  return { correct: true, feedback: "Correct!" };
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
// Must use a Map (or object) to cache results; must check before computing.

const cf14d: Checker = (answer) => {
  const norm = answer.toLowerCase();
  if (!/new\s+Map\s*\(\s*\)/.test(answer))
    return { correct: false, feedback: "Create a cache using new Map()." };
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
  if (/^function\s+(hello|applyDiscount|checkStock)/im.test(answer))
    return { correct: false, feedback: "Remove the function keyword — all three should use const name = (...) => syntax." };
  return { correct: true, feedback: "Correct!" };
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
  if (!/const\s*\{[^}]+\}\s*=\s*product/i.test(answer))
    return { correct: false, feedback: "Use destructuring: const { label, price, ... } = product." };
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
  if (!/is a.*with.*years of experience/i.test(answer))
    return { correct: false, feedback: "The output should read: \"Joana is a Developer with 5 years of experience.\"" };
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
  if (!/\.then\s*\(\s*\(\s*\)\s*=>/i.test(answer) && !/\.then\s*\(function/i.test(answer))
    return { correct: false, feedback: "Chain the courses using .then(() => prepareFood(...))." };
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
    return { correct: false, feedback: "You need two fetch() calls — one to get your location (ip-api.com/json) and one to get the weather from open-meteo." };
  if (!/ip-api\.com\/json/i.test(answer))
    return { correct: false, feedback: "Fetch your location first from http://ip-api.com/json." };
  if (!/open-meteo\.com/i.test(answer))
    return { correct: false, feedback: "Use the open-meteo API (api.open-meteo.com/v1/forecast) to get the weather for your coordinates." };
  if (!/\b(lat|latitude)\b/i.test(answer) || !/\b(lon|longitude)\b/i.test(answer))
    return { correct: false, feedback: "Destructure lat and lon from the location response and pass them to the open-meteo URL." };
  if (!/current_weather/i.test(answer))
    return { correct: false, feedback: "Add current_weather=true to the open-meteo URL and access data.current_weather in the response." };
  if (!/\baccurate\b/i.test(answer))
    return { correct: false, feedback: "Add an accurate field set to true if the weather data is less than 60 minutes old." };
  if (!/60/.test(answer))
    return { correct: false, feedback: "Compute the time difference in minutes and compare it to 60 to determine accuracy." };
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
