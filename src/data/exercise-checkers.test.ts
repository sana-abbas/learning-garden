import { describe, expect, it } from "vitest";
import { EXERCISE_CHECKERS } from "./exercise-checkers";

const check = (id: string, answer: string) => {
  const checker = EXERCISE_CHECKERS[id];
  if (!checker) throw new Error(`No checker registered for ${id}`);
  return checker(answer);
};

/** Passed the checker outright. */
const expectPass = (id: string, answer: string) => {
  const r = check(id, answer);
  expect(r.correct, `expected pass but got: ${r.feedback}`).toBe(true);
};

/** Provably wrong — student cannot submit. */
const expectBlocked = (id: string, answer: string) => {
  const r = check(id, answer);
  expect(r.correct, "expected a failure").toBe(false);
  expect(r.blocking, `expected blocking but got advisory: ${r.feedback}`).toBe(true);
};

/** Hint shown, but the student may still submit. */
const expectAdvisory = (id: string, answer: string) => {
  const r = check(id, answer);
  expect(r.correct, "expected a failure").toBe(false);
  expect(r.blocking, `expected advisory but got blocking: ${r.feedback}`).toBe(false);
};

/** Either passed outright or only advised — the student is never stuck. */
const expectNotBlocked = (id: string, answer: string) => {
  const r = check(id, answer);
  expect(r.correct || r.blocking === false, `submission was blocked: ${r.feedback}`).toBe(true);
};

describe("syntax gate", () => {
  it("blocks code that does not parse", () => {
    expectBlocked("cf6-f", `for (let i = 1; i <= 10 { sum += i; } console.log(sum);`);
  });

  it("reports the parse error in the feedback", () => {
    const r = check("cf5-b", `if (n > 0) { console.log("hi"); } else if { }`);
    expect(r.feedback).toMatch(/syntax error/i);
  });

  it("tolerates pasted markdown code fences", () => {
    expectPass(
      "cf6-f",
      "```jsx\nlet sum = 0;\nfor (let i = 1; i <= 10; i++) { sum += i; }\nconsole.log(sum);\n```",
    );
  });

  it("does not gate prose exercises", () => {
    // Free prose would never parse as JS; cf9-c must not be blocked by it.
    const r = check("cf9-c", "It prints 3 three times because var is function-scoped.");
    expect(r.feedback).not.toMatch(/syntax error/i);
  });
});

describe("cf6-f — sum up the numbers", () => {
  // The reported bug: identical logic passed with `i` and failed with `z`.
  const withVar = (v: string) =>
    `let sum = 0;\nfor(let ${v} = 1; ${v} <= 10; ${v}++){\nsum = sum + ${v};\n}\nconsole.log(sum);`;

  it("accepts any loop variable name", () => {
    for (const v of ["i", "z", "n", "count"]) expectPass("cf6-f", withVar(v));
  });

  it("accepts any accumulator name", () => {
    expectPass(
      "cf6-f",
      `let result = 0;\nfor (let z = 1; z <= 10; z++) { result = result + z; }\nconsole.log(result);`,
    );
  });

  it("accepts += and a descending loop", () => {
    expectPass(
      "cf6-f",
      `let total = 0;\nfor (let k = 10; k >= 1; k--) { total += k; }\nconsole.log(total);`,
    );
  });

  it("still catches a loop that stops short of 10", () => {
    expectBlocked(
      "cf6-f",
      `let sum = 0;\nfor (let i = 1; i < 10; i++) { sum += i; }\nconsole.log(sum);`,
    );
  });

  it("still requires a loop", () => {
    expectBlocked("cf6-f", `console.log(55);`);
  });
});

describe("cf5-b — check the number", () => {
  it("blocks the malformed else-if that used to pass", () => {
    expectBlocked(
      "cf5-b",
      `if (n > 0) {
console.log("The number is positive");
} else if {
if (n < 0) {
console.log("The number is negative");
} else {
console.log("The number is zero");
}
}`,
    );
  });

  it("accepts a correct answer", () => {
    expectPass(
      "cf5-b",
      `let n = -5;
if (n > 0) { console.log("The number is positive"); }
else if (n < 0) { console.log("The number is negative"); }
else { console.log("The number is zero"); }`,
    );
  });

  it("only nudges about a missing n declaration", () => {
    expectAdvisory(
      "cf5-b",
      `if (n > 0) { console.log("positive"); }
else if (n < 0) { console.log("negative"); }
else { console.log("zero"); }`,
    );
  });
});

describe("cf5-e — print the season", () => {
  const correct = `let month = 4;
switch (month) {
  case 12: case 1: case 2: console.log("winter"); break;
  case 3: case 4: case 5: console.log("spring"); break;
  case 6: case 7: case 8: console.log("summer"); break;
  case 9: case 10: case 11: console.log("fall"); break;
  default: console.log("month is not valid");
}`;

  it("accepts a correct answer", () => expectPass("cf5-e", correct));

  it("blocks the nested-switch structure that used to pass", () => {
    expectBlocked(
      "cf5-e",
      `switch (month) {
case 12: case 1: case 2: console.log("winter"); break;
switch (month) {
case 3: case 4: case 5: console.log("spring"); break;
switch (month) {
case 6: case 7: case 8: console.log("summer"); break;
switch (month) {
case 9: case 10: case 11: console.log("fall"); break;
default:
month = "month is not valid"
}`,
    );
  });

  it("blocks a default branch that assigns instead of logging", () => {
    expectBlocked(
      "cf5-e",
      correct.replace(`console.log("month is not valid")`, `month = "month is not valid"`),
    );
  });

  it("requires a break per season", () => {
    expectBlocked(
      "cf5-e",
      correct
        .replace(/break;/g, "")
        .replace('console.log("winter")', 'console.log("winter"); break'),
    );
  });
});

describe("cf9-c — playing with scopes", () => {
  it("accepts a correct explanation that never says 'closure'", () => {
    expectPass(
      "cf9-c",
      `Using var, it'll print 3 three times. var is function-scoped, so the setTimeout
       callbacks run after the loop has finished and i has already been incremented to 3.
       Using let, it prints 0, 1, 2 because each iteration gets its own i.`,
    );
  });

  it("accepts the student's submitted answer verbatim", () => {
    expectPass(
      "cf9-c",
      `1. using var, it'll print 3 three times. this is so because var is a function-scoped.
       therefore the setTimeout callbacks run after the loop has finished running. By the time
       it finishes being executed, i has been incremented to 3.

       2. Using let, it'll print out: 0  1   2. This is because each iteration of the scope
       gets its own value of i, which is preserved by the callback.`,
    );
  });

  it("never blocks, since prose cannot be proved wrong", () => {
    expectAdvisory("cf9-c", "I am not sure what this prints.");
  });
});

describe("cf9-d — improve the code", () => {
  it("accepts an answer that discusses var in prose", () => {
    expectPass(
      "cf9-d",
      `I would replace var with let so count is block-scoped:
function counter() {
  let count = 0;
  for (let i = 0; i < 3; i++) { count = i * 2; }
  return count;
}
console.log(counter());`,
    );
  });

  it("still requires the actual fix", () => {
    expectBlocked("cf9-d", `I would replace var with let everywhere.`);
  });
});

describe("cf9-e — fix the code", () => {
  const threeLogs = `console.log("Inner num:", num);
  console.log("Outer num:", num);
  console.log("Global num:", num);`;

  it("accepts moving the declaration above the increment", () => {
    expectPass(
      "cf9-e",
      `function inner() {\n  let num = 3;\n  // declare first, then increment\n  num += 1;\n  ${threeLogs}\n}`,
    );
  });

  it("accepts removing the inner declaration entirely", () => {
    expectPass("cf9-e", `function inner() {\n  num += 1;\n  ${threeLogs}\n}`);
  });

  it("does not block when the original code is quoted above the fix", () => {
    expectNotBlocked(
      "cf9-e",
      `Before:\nnum += 1;\nlet num = 3;\n\nAfter:\nfunction inner() {\n  let num = 3;\n  num += 1;\n  ${threeLogs}\n}`,
    );
  });
});

describe("cf13-h — OOP in action", () => {
  it("accepts two independent classes (inheritance is never asked for)", () => {
    expectNotBlocked(
      "cf13-h",
      `class IPhone {
  constructor() { this.battery = 100; }
  useApp(appName) { this.battery -= 10; console.log(appName, this.battery); }
  chargeBattery() { this.battery = 100; }
}
class Samsung {
  constructor() { this.battery = 100; }
  useApp(appName) { this.battery -= 5; console.log(appName, this.battery); }
  chargeBattery() { this.battery = 100; }
}`,
    );
  });

  it("accepts the inheritance version too", () => {
    expectPass(
      "cf13-h",
      `class Smartphone {
  constructor(drain) { this.drain = drain; this.battery = 100; }
  useApp(appName) { this.battery -= this.drain; console.log(appName); }
  chargeBattery() { this.battery = 100; }
}
class IPhone extends Smartphone { constructor() { super(10); } }
class Samsung extends Smartphone { constructor() { super(5); } }`,
    );
  });
});

describe("cf7-d — map the adults", () => {
  it("accepts a forEach solution", () => {
    expectPass(
      "cf7-d",
      `const adults = [];
function collect(list) {
  list.forEach((item) => {
    if (Array.isArray(item)) { collect(item); }
  });
}
if (family[1] >= 18) { adults.push(family[0]); }
console.log(adults);`,
    );
  });
});

describe("cf7-c — filter the numbers", () => {
  it("blocks a filter that keeps the odd numbers", () => {
    expectBlocked(
      "cf7-c",
      `const nums = [1,2,3,4];\nconsole.log(nums.filter((n) => n % 2 === 1));`,
    );
  });

  it("accepts the even filter", () => {
    expectPass("cf7-c", `const nums = [1,2,3,4];\nconsole.log(nums.filter((n) => n % 2 === 0));`);
  });
});

describe("cf4-c — find the right result", () => {
  const allLines = `console.log(4 + 3 === 7);
console.log(10 - 6 === 4);
console.log(2 * 5 === 10);
console.log(9 / 3 === 3);
console.log(7 % 3 === 1);
console.log(5 > 2 === true);
console.log(10 === "10" === false);
console.log(8 !== 8 === false);
console.log((true && false) === false);
console.log((true || false) === true);
console.log(!false === true);`;

  it("accepts a fully correct answer", () => expectPass("cf4-c", allLines));

  it("blocks an answer with lines deleted (these used to be skipped)", () => {
    expectBlocked("cf4-c", `console.log(4 + 3 === 7);`);
  });

  it("requires true for the || line now that the prompt brackets it", () => {
    expectBlocked(
      "cf4-c",
      allLines.replace("(true || false) === true", "(true || false) === false"),
    );
  });
});

describe("cf4-d — find the operator", () => {
  const withOps = (cmp: string, logical: string) =>
    `console.log(6 + 4 === 10);
console.log(5 * 5 === 25);
console.log(24 / 8 === 3);
console.log(12 == "12" === true);
console.log(9 ${cmp} 4 === true);
console.log(!false ${logical} !false === true);`;

  it("accepts every operator that satisfies the stated rule", () => {
    for (const cmp of [">", ">=", "!=", "!=="]) {
      for (const logical of ["&&", "||", "==", "==="]) {
        expectPass("cf4-d", withOps(cmp, logical));
      }
    }
  });

  it("still rejects an operator that does not print true", () => {
    expectBlocked("cf4-d", withOps("<", "&&"));
  });
});

describe("loosened identifier and syntax coupling", () => {
  it("cf2-b accepts a template literal", () => {
    expectPass("cf2-b", "console.log(`Hello World!`);");
  });

  it("cf6-c accepts Math.trunc as well as Math.floor", () => {
    const reverse = (truncate: string) =>
      `let n = 5831;\nlet out = 0;\nwhile (n > 0) { out = out * 10 + (n % 10); n = ${truncate}(n / 10); }\nconsole.log(out);`;
    expectPass("cf6-c", reverse("Math.floor"));
    expectPass("cf6-c", reverse("Math.trunc"));
  });

  it("cf14-j accepts let destructuring, not just const", () => {
    const answer = (kw: string) =>
      `${kw} { label, price, specs: { color }, reviews } = product;\nconsole.log(label, price);\nconsole.log(color, reviews);`;
    expectPass("cf14-j", answer("const"));
    expectPass("cf14-j", answer("let"));
  });

  it("cf14-f rejects a function expression assigned to a const", () => {
    expectBlocked(
      "cf14-f",
      `const hello = function () { return "Hello there!"; };
const applyDiscount = (price, discount) => price - discount;
const checkStock = (quantity) => (quantity > 0 ? "In Stock" : "Out of Stock");`,
    );
  });

  it("cf7-j accepts a lowercased filename", () => {
    expectPass(
      "cf7-j",
      `const queue = ["Monthly_Report.pdf"];\nconsole.log(queue.shift());\nqueue.push("statistics_data.json");\nconsole.log(queue);`,
    );
  });

  it("cf3-d requires typeof on more than one variable", () => {
    expectBlocked(
      "cf3-d",
      `console.log(typeof x); // types: true, null, undefined, 1, "text", {a:1}`,
    );
  });

  it("cf14-l accepts the sentence the prompt actually asks for", () => {
    expectPass(
      "cf14-l",
      'const firstName = "Joana";\nconst role = "Developer";\nconst yearsExperience = 5;\n' +
        "console.log(`${firstName} is a ${role} with ${yearsExperience} years of experience.`);",
    );
  });
});

describe("registry", () => {
  it("every checker returns a well-formed result for empty input", () => {
    for (const [id, checker] of Object.entries(EXERCISE_CHECKERS)) {
      const r = checker("");
      expect(typeof r.correct, `${id} returned a malformed result`).toBe("boolean");
      expect(typeof r.feedback, `${id} returned a malformed result`).toBe("string");
      expect(r.feedback.length, `${id} returned empty feedback`).toBeGreaterThan(0);
    }
  });

  it("never blocks on an exercise whose answer is prose", () => {
    for (const id of ["cf1-c", "cf8-f", "cf9-c"]) {
      const r = EXERCISE_CHECKERS[id]("some thoughtful but unrecognised prose answer");
      if (!r.correct) expect(r.blocking, `${id} blocked a prose answer`).toBe(false);
    }
  });
});
