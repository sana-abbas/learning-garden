/**
 * TermBank, the Coding Fundamentals guided final project (chapter cf17).
 *
 * Copied from the "TermBank Guided Project" and "TermBank Hints" Google Docs
 * (2026-10-22). Edit here, not in the docs — the garden doesn't read them.
 */

export const TERMBANK_CONTENT: Record<string, string> = {
  "cf17-intro": `**A bank teller's terminal, built entirely in vanilla JavaScript.**

## Welcome to your biggest challenge yet!

You've learned algorithms, variables, loops, functions, objects, classes, error handling, async code, and even how to talk to a real API. Now it's time to put all of it into one project - not a five-line exercise, but a real, working application with many moving parts.

This is called a guided project because we're telling you exactly what to build and in what order, but every line of code is yours to write. Think of it like a recipe with very clear steps but no photos: you know what each stage should achieve, but you decide how to get there.

## Who is actually using TermBank?

To keep every single command realistic, TermBank is built from one consistent point of view: you are building the terminal used by a bank teller (or branch agent) at a physical branch. That one decision is what makes every command below make sense:

* A teller can open a new account for a customer standing at the counter, search for an account, list all accounts.
* A teller can process a cash deposit or withdrawal for a customer, because the customer physically handed over (or is receiving) the cash.
* A teller can look up any customer's account by id, view its history, or reverse a mistaken transaction, but only while logged into their own shift.
* A teller can quote a customer a live exchange rate at the forex desk.
* A teller never 'logs in as' a customer. Logging in represents the teller clocking into their shift: every transaction still names the exact customer account it applies to.

By the end, TermBank will let a teller:

* \`create-account <name> [accountType]\` - open a new account for a customer (the optional argument accountType is the word "savings", or left out for a regular account, e.g. \`create-account SpongeBob savings\` or \`create-account Patrick\`)
* \`display-account <accountId>\` - search for an existing account and display its details
* \`list-accounts\` - list all existing customer accounts
* \`login <tellerId>\` / \`logout\` - start and end your shift at this terminal
* \`deposit <accountId> <amount>\` / \`withdraw <accountId> <amount>\` - process a cash transaction for a customer
* \`transfer <fromId> <toId> <amount>\` - move money between two accounts (large transfers need manager approval)
* \`history <accountId>\` / \`reverse <accountId>\` - view a customer's recent transactions, and correct a mistaken one
* \`close-account <accountId>\` - close an account, only once its balance is 0
* \`exchange <amount> <currencyCode>\` - quote a customer a real, live currency conversion
* \`help\` - see all available commands

## Your starter kit

You don't need to know HTML or CSS for this project. Save these two files exactly as they are and only add JavaScript below the line marked in script.js.

**index.html**

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TermBank</title>
</head>
<body style="background:#111;color:#0f0;font-family:monospace;padding:20px;">
  <pre id="output" style="max-height:80vh;overflow-y:auto;text-wrap:wrap;overflow-wrap:break-word;">Welcome to TermBank. Type "help" to get started.</pre>
  <input id="commandInput" type="text" placeholder="Type a command..."
         style="width:80%;padding:8px;font-family:monospace;" autofocus>
  <script src="script.js"></script>
</body>
</html>
\`\`\`

**script.js (starter)**

\`\`\`js
function print(text) {
  const output = document.getElementById("output");
  output.textContent += text + "\\n";
  output.scrollTop = output.scrollHeight;
}

// -----------------------------------------
// Your code starts here - Milestone 1 first!
// -----------------------------------------
\`\`\`

## Concept map

A quick look at how this project connects back to everything you've learned so far:

| Milestone | Curriculum sections it draws on |
| --- | --- |
| 1. Wake Up the Terminal | Events, DOM Manipulation |
| 2. The Command Parser | Operators, Conditionals, Functions |
| 3. Opening Accounts & Serving Customers | Data Structures (Array/Object), Loops, Template Literals |
| 4. Locking Down the Balance | OOP: Encapsulation |
| 5. Special Account Types | OOP: Inheritance & Polymorphism |
| 6. Clocking In: Teller Sessions | Variable Scope, ES6+ (Map) |
| 7. Transaction History & Corrections | Data Structures: Stack, Recursion (stretch) |
| 8. Handling Real Mistakes | Error Handling |
| 9. Manager Approval for Transfers | Asynchronous Execution (Promises, async/await) |
| 10. The Forex Desk | API Basics, fetch(), Error Handling |
| 11. Clean Code Refactor | Modular design, ES Modules (import/export) |
| 12. Make It Yours | DOM Manipulation, Events, Clean Code, plus whatever you choose |

One heads-up: for the first ten milestones, just double-click index.html, or right-click the file and click 'Open With Google Chrome', for example, to open it in your browser - no setup needed. Near the end (Milestone 11), you'll split your code into several files and will need a very quick one-time setup step (a free VS Code extension) - we'll explain exactly what to do when you get there.

## How to work through this project

* Do the milestones in order. Each one builds on the last, and skipping ahead usually means redoing work later.
* Read the 'Why this matters' note before you start coding - it tells you what real system this mirrors.
* Try for real before opening a hint. The hints are there to unstick you, not to be your first move.
* Test each milestone in the terminal itself before moving to the next one. Don't wait until the end to check if things work.
* It's okay if your solution looks different from anyone else's. As long as the requirements are met, your approach is valid.
* When a milestone works, paste your code into it here and submit. Your mentor will review each one.
`,

  "cf17-m1": `## Why this matters

Every command-line tool, like the command prompt/terminal in your machine, starts the exact same way: it listens for what you type, and shows you something back. Get this working first and everything else has somewhere to live.

## What you're adding

Wire up the provided input box so that when someone presses Enter, whatever they typed gets echoed back into the output area using the \`print()\` function already given to you.

## Requirements

* The teller can type text into the existing input box.
* When the teller presses Enter, the typed text appears in the existing output box.
* Clear the input box afterwards so it's ready for the next command.
`,

  "cf17-m2": `## Why this matters

A terminal is only useful if it can tell the difference between 'help', 'deposit 4001 500', and gibberish. Real command-line tools (browser console, USSD banking menus) all start with exactly this problem: turning one typed line into a command and its arguments.

## Requirements

* The teller types a command word, optionally followed by arguments separated by spaces, e.g. \`deposit 1001 500\`.
* Extra spaces anywhere in the line (at the start, at the end, or several between words) don't change the result: \`deposit    1001    500\` behaves exactly like \`deposit 1001 500\`.
* The \`help\` command prints every command TermBank will eventually support, along with the arguments each one takes (see the full list in "Welcome & starter kit").
* Any command TermBank doesn't recognise prints a friendly message pointing the teller to help, e.g. \`Unknown command "depsit". Type "help" to see all commands.\`
`,

  "cf17-m3": `## Why this matters

A customer walks up to your counter. Only you, the teller, can open their account or take their cash.

## What is an account in TermBank?

Every (bank) account holds exactly these four pieces of information:

| Field | What it is | Example |
| --- | --- | --- |
| Account ID | A unique number TermBank assigns automatically when the account is opened (see below) | 1001 |
| Customer name | The name the teller typed in create-account | SpongeBob |
| Account type | regular or savings. For now every account is regular - savings arrives in Milestone 5 | regular |
| Balance | The amount of money in the account. Every new account starts at 0 | 0 |

**How account ids work:** think of the account id as the account number on a real bank account. The bank gives it out when the account is opened, it never changes, and no two accounts ever share one - not even after an account is closed. TermBank works the same way: it assigns each new account its own unique id automatically.

## Requirements

* Implement \`create-account <name>\` - opens a new regular account for that customer with a balance of 0, and tells the teller the new account id.
* Implement \`display-account <accountId>\` - find an account by the given id from the existing ones and display its information.
* Implement \`list-accounts\` - print all existing accounts and for each display the account type (savings or regular), account id, customer name, and balance.
* \`deposit <accountId> <amount>\` adds the amount to that account's balance and tells the teller the new balance.
* \`withdraw <accountId> <amount>\` takes the amount out of that account's balance and tells the teller the new balance.
* **Bonus:** Update \`create-account\` to accept full names with more than one word, like John Doe, instead of only single names like John.
`,

  "cf17-m4": `## Why this matters

Right now, nothing stops a bug (or a careless line of code) from writing \`account.balance = 999999999\` directly. Real banking software would never allow that: balance should only ever change through controlled, validated operations.

## Requirements

* An account's balance can only be changed through the official operations: deposit and withdraw. If any code outside those operations tries to change a balance, it must fail or have no effect.
* The rules for changing a balance live with the account itself, not in your command code: the deposit and withdraw commands just find the right account and ask it to do the work.
* Everything from Milestone 3 still works exactly as before.
`,

  "cf17-m5": `## Why this matters

Real banks don't have just one kind of account. Savings accounts often charge a small fee per withdrawal, current accounts don't. Your code needs to handle both without a giant pile of if/else checks scattered everywhere.

## Requirements

* \`create-account <name> savings\` opens a savings account. \`create-account <name>\` (no type) opens a regular account, as before. Every new account still starts at 0 balance either way.
* Every withdrawal from a savings account takes out the requested amount plus a fixed fee of 10. Regular accounts have no fee.
* Apart from that fee, a savings account behaves exactly like a regular account - and the behaviour they share is written only once. No copy-pasted deposit or withdraw logic.
* The withdraw command itself doesn't check what type of account it's dealing with - each account handles its own rules.
* \`display-account\` and \`list-accounts\` show the correct type for every account.

Don't worry yet about handling an invalid account type, like \`create-account Amina kid\`. You'll handle that in Milestone 8.
`,

  "cf17-m6": `## Why this matters

A real teller logs into their own terminal at the start of a shift - not as any particular customer, but as themselves, the employee. Nothing should be processable at the counter until a teller is actually on duty. And with hundreds of customers, scanning a whole list to find one account by id stops being good enough.

## What is a teller id?

A teller id is the staff code the bank gives each teller who works at this branch, for example T01, T02, T03. The bank hands out each code once and never gives the same code to two people. That's why we use an id instead of a name: two tellers can easily share a first name, but never a teller id.

TermBank keeps its own list of the teller ids that work at this branch. You choose the ids, and there should be at least three.

## Requirements

* \`login <tellerId>\` starts a shift for that teller, but only if the id is on the branch's teller list. Any other id is refused with a friendly message.
* Only one teller can be on duty at this terminal at a time. If someone tries to log in while a shift is already active, TermBank tells them who is on duty and that they need to logout first.
* \`logout\` ends the current shift. If nobody is logged in, TermBank says so.
* Every command except \`help\` and \`login\` refuses to run, with a clear message, if no teller is on duty. This includes the commands you'll add in later milestones.
* Only login and logout can change who is on duty. No unrelated part of your code can accidentally overwrite it.
* Finding an account by its id stays fast even with 10,000 accounts: TermBank shouldn't have to check accounts one by one to find the right one.
* Every command from earlier milestones still works.
`,

  "cf17-m7": `## Why this matters

Every real bank statement shows the most recent transaction first. And when a teller makes a mistake - types the wrong amount, hits the wrong account - banks don't pretend it didn't happen; an authorized correction (a reversal) is logged just like any other transaction.

## Requirements

* Every deposit, withdrawal and savings fee is recorded on the account it happened to, with its type, its amount, and the balance right after it.
* \`history <accountId>\` shows that account's transactions, most recent first. If the account has no transactions yet, indicate so.
* \`reverse <accountId>\` undoes the most recent transaction on that account: the balance goes back to what it was before it. Nothing disappears - the original transaction stays in the history, and the reversal is recorded as a new entry that clearly shows which transaction it corrected.
* A reversal can't itself be reversed, and a transaction can only be reversed once. If the most recent entry is a reversal, the teller gets a friendly message instead.
* Trying to reverse on an account with nothing to reverse gives a friendly message.

💡Deep Dive (optional stretch): add a \`compound-interest <accountId> <years>\` command that recursively calculates what that account's balance would grow to at 5% annual interest over N years. This is a real recursive pattern used in actual financial calculators.
`,

  "cf17-m8": `## Why this matters

Right now, someone can probably withdraw more money than an account has, or type an account id that doesn't exist, and something ugly happens. Real financial software is judged almost entirely on how gracefully it handles exactly these situations.

## Requirements

* A withdrawal that would take an account's balance to below 0 (including a savings account's fee) is refused with a clear message, and the balance doesn't change.
* Amounts that are negative, zero or not a number are refused, with a clear message, anywhere an amount is accepted.
* An account id that doesn't exist is refused, with a clear message, in every command that takes one.
* A command that's missing arguments (e.g. \`deposit 1001\`) shows the teller the correct way to use it.
* \`create-account\` with an invalid account type (e.g. \`create-account Amina kids\`) is refused with a message listing the valid types, and no account is created.
* \`close-account <accountId>\` closes the account, but only if its balance is exactly 0. If it isn't, the account stays open and the teller is told why (a real bank wouldn't let you close an account with money still in it). A closed account no longer shows up in \`list-accounts\`, and its id is never given to a new account.
* No matter what the teller types, the terminal never crashes, and the teller can always type another command straight after an error.
`,

  "cf17-m9": `## Why this matters

Real bank tellers can't just move any amount of money on their own say-so: transfers above a certain size need a supervisor's sign-off before they go through. The terminal shouldn't freeze while that approval is 'pending'; a real teller needs to keep serving the next customer in line.

## Requirements

* \`transfer <fromId> <toId> <amount>\` moves the amount from one account to the other. Both balances update, and the transfer shows up in both accounts' history.
* Transfers of 10,000 or less go through immediately.
* Transfers above 10,000 need manager approval: TermBank immediately prints \`Transfer pending manager approval...\`, then completes the transfer and prints a confirmation 3 seconds later.
* While a transfer is pending, the teller can keep typing and running other commands to serve the next customer.
* All the Milestone 8 rules apply: unknown ids, bad amounts, not enough money, or transferring to the same account are refused with a friendly message.
* A transfer can never take the sending account below KES 0 - not even if its balance changed while the approval was pending.
`,

  "cf17-m10": `## Why this matters

A customer at your counter asks what their KES (for example) would be worth in USD before deciding whether to exchange it. This is the moment TermBank stops being a simulation and starts talking to the real world, the same way any real app checks a live price, a live weather forecast, or a live stock quote.

## Requirements

* \`exchange <amount> <currencyCode>\` shows what that amount of KES (for example) is worth in the requested currency, e.g. \`KES 1000 = USD 7.74\`.
* The rate is a real, live rate from a public exchange-rate API at the moment the teller asks (e.g. https://open.er-api.com/v6/latest/KES - check its current docs, as free API details can change over time).
* Currency codes work in upper or lower case (\`usd\` and \`USD\` give the same result).
* If the rate can't be fetched (no internet, API down) or the currency code doesn't exist, the teller sees a friendly message - never a crash.
* **Bonus:** fetched rates are reused for a few minutes, so repeated exchange commands don't call the API every single time.

💡Deep Dive (optional): If 500 branches all typed 'exchange' at the same second, what would happen to the exchange-rate API? Is there anything your app could do differently to be a better citizen of that shared, external system?
`,

  "cf17-m11": `## Why this matters

No real engineering team keeps a whole application in one file. Code gets split into small files, each with one clear job, so it's easy to find things, easy to change one part without breaking another, and easy for more than one person to work on at once.

## One-time setup (do this first)

Browsers only let separate JavaScript files share code with each other when the page is served properly, instead of double-clicked. Here's how:

1. Install the free 'Live Server' extension in VS Code.
2. Open your project folder in VS Code and click 'Go Live' in the status bar to turn the server on/off - this opens the application in your default browser. You can also open index.html, right-click in the editor and click 'Open with Live Server'. (The extension's details tab lists several shortcuts.) You don't need to understand how it works internally.
3. Change your script tag in index.html to \`<script type="module" src="main.js"></script>\`.

## Requirements

* Your code is split into separate files, each with one clear job. At a minimum, keep these apart: the account types, the command handling, the exchange-rate fetching, the terminal display and input, and one entry file (main.js) that starts everything.
* Each file shares only what other files genuinely need from it, and uses only what it actually needs from others.
* No function does more than one clearly separate job.
* File and function names make it obvious what's inside without needing to open them.
* Everything from Milestones 1-10 still works exactly as before.

💡Deep Dive (optional): Curious why \`type="module"\` doesn't work when you just double-click index.html, but works fine with Live Server? Look up why browsers block ES modules over the file:// protocol - it's a security rule, not a bug.

**Submitting this milestone:** paste each of your files into its own box below, with its file name.
`,

  "cf17-m12": `## Why this matters

Real software is never finished at the spec. Teams take a working core and keep improving it for the people who use it every day. TermBank works. Now decide what a real teller would wish it could do, or how it should feel to use. This is also the version you'll show the community, so make it something you're proud of.

## Requirements

* Add at least one feature that changes what TermBank does, not only how it looks. Beyond that, go as far as you like. A few solid features beat many half-working ones.
* Every feature must fit the teller's point of view: something a real teller at a real counter would do or need.
* Put new code in well-named modules, following the Milestone 11 rules (small files, functions that do one thing).
* New commands must handle bad input with friendly messages (Milestone 8) and appear in your help output.
* Everything you built in Milestones 1–11 must still work.
* It stays a terminal: text in, text out. No buttons, forms or menus. Any visual changes are done in JavaScript. You don't need to edit index.html or learn CSS.

## Idea menu (pick from here or invent your own)

**Make it feel real**

* Print a formatted receipt after every deposit, withdrawal or transfer, with a timestamp.
* Add an end-of-shift summary: total deposits, total withdrawals and number of transactions handled by the logged-in teller.
* Add a customer queue at the counter: \`join-queue <name>\`, \`next-customer\`.
* Add \`find <partOfName>\` to search accounts by name.

**Make it feel friendly**

* Add colour-coded output: green for success, red for errors.
* Add \`help <command>\` for detailed help on a single command.
* Add \`clear\` to wipe the screen.
* Let the up-arrow bring back previous commands.

**Submitting this milestone:** paste each of your files into its own box below, and add a link to a short video of TermBank in action (Loom or YouTube).
`,

  "cf17-showcase": `## Getting ready for the community showcase

* Your audience is the whole community - show what a teller experiences, not the code.
* Script your demo: write the exact 6–10 commands you'll type, in order, and rehearse them. Live typing mistakes eat into your time.
* Choose one "wow" moment and build the demo toward it.
* Include one graceful failure, such as a wrong account id getting a friendly message. It shows your app is robust.
* Keep the technical explanation for your mentor. Be ready to tell them a design decision you made and why.

## You made it! 🎉

TermBank now handles accounts, authorized sessions, history and corrections, real-world delays, and even talks to a live service on the internet. That's not a small project - that's a real application. Take a moment to look back at Milestone 1 and compare it to what you just built.
`,
};

/** Hints per milestone, revealed one at a time. Milestone 12 has none. */
export const TERMBANK_HINTS: Record<string, string[]> = {
  "cf17-m1": [
    "You already have `print()` - don't rewrite it, just call it.",
    'You\'ll need to know when a key is pressed in `#commandInput`. `addEventListener("keydown", ...)` or `addEventListener("keypress", ...)` both work - try one and log the event object to the console to see what it gives you.',
    'Setting `input.value = ""` is how you clear a text box.',
  ],
  "cf17-m2": [
    'A built-in String method can split a line into words in one go: `"deposit 1001 500".split(" ")` gives you `["deposit", "1001", "500"]`. Now try it with extra spaces and see what happens.',
    "For the extra-spaces requirement, consider `trim()` together with a regular expression.",
    "The first word is the command; everything after it is the arguments.",
    "A `switch` statement or an if/else chain both work for routing.",
    "Keep one running list of supported commands somewhere, so help and your 'unknown command' fallback both stay in sync as you add more milestones.",
  ],
  "cf17-m3": [
    "A plain object like `{ id, name, accountType, balance }` is completely fine for an account at this stage.",
    "A simple growing counter (or `Date.now()`) both work fine for generating an id at this stage.",
    "A template literal makes lines like `[regular] #1001 - SpongeBob: KES 0` easy to build.",
    "For the bonus task, a flag-style keyword handles names better than counting words: something like `create-account John Doe --savings`, where anything starting with `--` is the account type, and everything else, joined back together, is the name. `.filter()` and `.includes()` are enough to pull it out.",
  ],
  "cf17-m4": [
    "Go back and reread the section on Object Oriented Programming, especially on Encapsulation and the Account example.",
    "A class with a private field (the `#` prefix) is JavaScript's built-in way to stop outside code from touching data.",
    "A getter lets other code read a value without being able to set it.",
    "If you try `account.#balance = 500` from outside the class and JavaScript doesn't stop you, double check the `#` is really part of the field declaration.",
    "create-account will now need to make a new instance with the `new` keyword, instead of a plain object.",
  ],
  "cf17-m5": [
    "This is almost identical to the SavingsAccount example already in your curriculum chapter (OOP Section). The fee-on-withdraw pattern is deliberately the same.",
    "`extends` lets one class build on top of another, so it gets all of the parent's behaviour for free.",
    "`super` lets the child class reuse the parent's version of a method, instead of rewriting it.",
    "If your withdraw command has an `if (account is savings)` check inside it, that's a sign polymorphism isn't doing its job yet. The class itself should handle the difference.",
    'That type word is just a keyword you check for (the string "savings"), nothing to do with money.',
  ],
  "cf17-m6": [
    "Revisit the Map in the ES6 Features Section: `myMap.get(id)` and `myMap.set(id, account)` replace searching through a list, and they're much faster at scale. You'll need to update every command that looks up an account.",
    "A `Set` is a natural fit for a list of unique teller ids, and `has()` checks it quickly.",
    "Where the 'current teller' lives is the exact scope problem from the Variable Scope Section - decide deliberately whether your session variable is a genuinely global variable, or something scoped inside a larger structure.",
  ],
  "cf17-m7": [
    "Re-read the Data Structures Section in your curriculum chapter before choosing how to store the history: the 'last one in, first one reversed' behaviour should sound familiar.",
    "Reversing a withdrawal means putting the amount back (and vice versa).",
    "Remember the rule from Milestone 4: the balance can only change through the account itself. That applies to reversals too.",
  ],
  "cf17-m8": [
    '`throw new Error("Insufficient funds")` anywhere your validation fails, and `catch (error) { print(error.message) }` around your command handler.',
    "One try/catch around your command routing can catch errors thrown by every command.",
    "This is the same try/catch/finally shape as the ATM exercise you already did - this milestone is that exercise, but for keeps.",
    "`Number()` and `Number.isNaN()` help you check whether an amount is really a number.",
    "Closing an account means removing it from where you store accounts. This is the first command that deletes something rather than adding or changing it.",
    'If you did the multi-word name bonus in Milestone 3: how will TermBank tell the name "Amina Kids" apart from the name "Amina" with the type "kids"? The `--savings` flag style makes this much easier.',
  ],
  "cf17-m9": [
    "Go back to the restaurant/kitchen example in the Asynchronous Executions Section - the waiter (your terminal) should never stop taking new orders (commands) just because one dish (transfer) is still cooking.",
    "Try `async` and `await` here rather than nested `.then()` chains - it keeps the code reading top to bottom.",
    "`await new Promise(resolve => setTimeout(resolve, 3000));` is the shape of the waiting part.",
  ],
  "cf17-m10": [
    "`fetch()` together with async/await is exactly the pattern from the weather example in the API Basics Section.",
    "Check `response.ok` before trying to read `response.json()`.",
    "For the bonus, think back to the Fibonacci cache exercise in the ES6 Features Section - and remember to keep track of *when* you fetched the rates.",
    "Want to see your error handling actually work? Open DevTools (see the console shortcuts in Section 2), go to the **Network** tab, and switch the throttling dropdown from 'No throttling' to **Offline**. Now run exchange - TermBank should show your friendly message instead of crashing. Don't forget to switch it back afterwards!",
  ],
  "cf17-m11": [
    "A split that works well: `account.js`, `commands.js`, `api.js`, `terminal.js` and `main.js`.",
    '`export class Account { ... }` in one file, then `import { Account } from "./account.js";` in another, is the whole pattern.',
    "If two files need to import from each other, that's usually a sign something should move into a third, shared file instead.",
    "A quick test for 'is this file doing one job': if you deleted it, could you describe in one sentence what broke?",
  ],
};
