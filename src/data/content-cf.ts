// Learning material content for Coding Fundamentals subtasks.
// Keyed by subtask ID. Subtasks without an entry show no content modal.
export const CF_CONTENT: Record<string, string> = {

  "cf0-a": `Before you start coding, let's set up your computer. Don't worry if you have never done this before, we will go step by step, and you only need to do this once. This chapter has no exercises, just a simple checklist.

> 👉 What you need to install:
> You only need two things to get started. Both are free.

A web browser like Google Chrome or Mozilla Firefox. This is the program you use to visit websites. We recommend Google Chrome, since our examples use it. If you already have a browser on your computer, that's great, you don't need to install anything new.
`,

  "cf0-b": `Visual Studio Code (VS Code), a free program where you will write your code. It is like a notebook made for writing code instead of stories. You can download it from [code.visualstudio.com](http://code.visualstudio.com/). Just click the big download button for your computer (Windows or Mac) and follow the install steps, the same way you would install any other program.

💡 Tip: You don't need to install JavaScript itself. It already lives inside your browser, ready to use.
`,

  "cf0-c": `The console is a small panel inside your browser where JavaScript code can be typed and run. You will use it a lot in this chapter. Here is how to open it:

* Google Chrome (Windows): press Ctrl + Shift + J
* Google Chrome (Mac): press ⌘ (Cmd) + Option + J
* Mozilla Firefox (Windows): press Ctrl + Shift + K
* Mozilla Firefox (Mac): press ⌘ (Cmd) + Option + K

If the shortcut doesn't work, you can also find it in the menu: click the three dots (or lines) in the top corner of your browser, then look for something called "More Tools" or "Web Developer", and select "Developer Tools" or "Console".
`,

  "cf0-d": `The terminal (also called "command line") is a program on your computer where you can type commands instead of clicking with your mouse. It looks a bit plain and old-fashioned, but don't be scared of it — we will only use very simple commands, and we will explain each one when the time comes.

* On Windows: click the Start menu (or press the Windows key), type "Command Prompt" or "PowerShell", and press Enter to open it.
* On Mac: press Cmd + Space to open Spotlight Search, type "Terminal", and press Enter to open it.

You can also open a terminal directly inside VS Code: once VS Code is open, look at the top menu, click "Terminal", then click "New Terminal". A panel will open at the bottom of the screen, that is your terminal.

☝️ Good to know: the browser console and the terminal are two different things. The console runs JavaScript inside a web page. The terminal runs commands directly on your computer. You will use both throughout this curriculum, so it's fine if it takes a little time to remember which is which.

**Need help?**

If anything here is unclear, or something doesn't work the way it's described, please don't worry and don't get stuck alone. Post your question in the curriculum channel, and your mentor or a teammate will help you get set up.
`,

  "cf1-a": `When learning a programming language, like JavaScript, it is important to start from the foundations of algorithms, because these concepts are applied independently of the programming language you choose.

> 👉 For example, a similar concept of a function to execute a desired command can be written in JavaScript, Python, C, or any other programming language, only by using a different syntax.

Besides these basic concepts, a programming language also follows one or multiple programming paradigms. This is important to keep in mind, because it usually defines how we think when writing a program with a respective programming language. You will find a detailed explanation of paradigms in their respective section, later in the chapter.

So in this section, we are going to look into algorithms and programming paradigms on a surface level, to give you an idea of the most important concepts. Later in this chapter we will deep dive into the nitty gritty of javascript.
`,

  "cf1-b": `An algorithm is a set of instructions for performing a programming task, just as you would have a recipe for cooking a dish or a step-by-step guide for performing an everyday task.

> 👉 Example: You are going to wash the dishes after a family dinner. The following algorithm could be performed:

1. Gather all the dirty dishes in the sink.
2. Gather all the cleaning tools you need.
3. Remove large food scraps from the plates.
4. Add soap to the sponge.
5. Add water to the sponge.
6. Scrub each item one by one until clean.
7. Rinse each item until no soap is left on it.
8. Place each item in the drying rack.

Here, it's important to note a few things:

- The instructions are executed in a proper order. For example, it does not make sense to perform instruction 8 before instruction 7.
- Some instructions might respond or be executed only when a condition is fulfilled. For example, instruction 7 is only performed if the given condition (all dishes are scrubbed) is achieved.
- There is a defined end to the algorithm. For example, if instruction 8 is never performed, the dishes would still be in the sink, thus remaining in a so-called infinite loop.

💡Deep Dive: What are the main problems of having an infinite loop?

👉Let's have another example: You come home hungry and decide to cook rice. You then remember that your grandmother once gave you a recipe for a yummy rice dish. Unfortunately, the recipe is not really legible anymore -  you can only see some random instructions that are out of order.

In these examples, we covered the IF condition and implicitly the ELSE condition of control flow. They are used to execute (or to not execute) an instruction based on a condition. In the case of cooking the rice, we could write the conditions as follows:

\`\`\`
IF rice is too hard THEN
ADD more water and cook for 2 more minutes
ELSE
GET pot from the stove (it means rice is ready)
END IF
\`\`\`

We also covered two other types of control flow: While loop and for loop. They are used to indicate a repeated instruction or multiple instructions and contain a way to end the loop (termination condition).
In the case of cooking rice, we could write the conditions as follows:

\`\`\`
FOR minute = 1 to 8
wait (rice is cooking)
END FOR
\`\`\`

In the case of washing the dishes, it could be like this:

\`\`\`
WHILE exists dirty dishes DO
wash
END WHILE
\`\`\`

Both examples could also be written in pseudocode, meaning writing them in a programming-like style without following any particular syntax and thus focusing only on the logic.

Washing dishes example:

\`\`\`
START
PUT dirty dishes in the sink
GET soap
GET sponge
REMOVE large food scraps
ADD soap to the sponge
ADD water to the sponge
WHILE exists dirty dishes DO
SCRUB dirty dishes with sponge
END WHILE
	WHILE exists dishes with soap DO
RINSE the dishes
SET dishes in the drying rack
END WHILE
END
\`\`\`

Cooking rice example:

\`\`\`
START
GET 100g of rice
WHILE rice not clear DO
	rinse under water
END WHILE
ADD rice to a pot
ADD 200ml of salted water to pot so that the rice is covered
ADD lid to the pot
	PUT pot on the stove on high temperature
WHILE water not boiling DO
	wait
END WHILE
SET low temperature
FOR minute = 1 to 8
wait
END FOR
IF rice is too hard THEN
ADD more water
FOR minute = 1 to 2
wait
END FOR
ELSE
remove pot from the stove
END IF
GET rice
END
\`\`\`

Now that you have a full recipe for cooking rice written in pseudocode, imagine that you are having a family dinner, which means you will need to cook more rice at once. What would you adapt or change in the instructions above? How would you make it more generic, so that it can be used for cooking different amounts of rice?

In this case, you can use variables to represent some state, object, data, etc. Variables are containers in which you store a value. That value can be either static (i.e. it never changes) or dynamic (i.e. it is changeable).

> 👉For example, this is how we can rewrite the recipe for cooking rice using variables:

\`\`\`
START
	SET rice TO 100
	SET saltedWater TO rice * 2
WHILE rice is not clear DO
	rinse under water
END WHILE
ADD rice to a pot
ADD saltedWater to the pot to cover the rice
ADD lid to the pot
PUT pot on the stove
SET stoveFire TO high
WHILE salted water not boiling DO
	WAIT
END WHILE
SET stoveFire TO low
FOR minute = 1 to 8
wait
END FOR
IF rice is too hard THEN
ADD more water
FOR minute = 1 to 2
wait
END FOR
ELSE
remove pot from the stove
END IF
GET rice
END
\`\`\`

In this example, there are 3 variables: rice, saltedWater, and stoveFire.
The variable rice is now set to 100 but if you needed to cook more rice you would change this variable to, for example, 200.. As the amount of rice changes, so will the amount of water. This will happen automatically, as the variable "water" is set to be 2x the amount of rice. These variables are set at the beginning of the algorithm and never change, so they are static.
On the other hand, the variable stoveFire is set as high initially but during the execution of the algorithm, it changes to low, therefore it is a dynamic variable.
These variables represent numbers and strings (text), but they could also have other types, like a logical boolean (true/false) or an array (list) of other types.

When looking at our pseudocode, we can see a structure with indentations, as you can see in these blocks of instructions.

\`\`\`
IF rice is too hard THEN
ADD more water
FOR minute = 1 to 2
wait
END FOR
END IF
\`\`\`

In this case, the first indentation (yellow) means these lines of pseudocode are part of a block, treated as one unit. The second indentation (red) is dependent on the previous unit (yellow) and will execute accordingly.
In practical terms, this means that the waiting is only performed in case the rice is too hard and after water is added. In our pseudocode we are creating a block solely through indentation, however in real code the creation of a block varies depending on the programming language used.  For example, in JavaScript, a code block begins with "{" and ends with "}" as visualized here:

\`\`\`
IF rice is too hard {
add more water
FOR minute = 1 to 2 {
wait
}
}
*Please note: This is still pseudocode, not a valid JavaScript code yet.
\`\`\`

> 👉Let's have another example: You come home hungry and decide to cook rice. You then remember that your grandmother once gave you a recipe for a yummy rice dish. Unfortunately, the recipe is not really legible anymore -  you can only see some random instructions that are out of order.
`,

  "cf1-c": `📝 Exercise 1: Reorganize the algorithm
Reorganize all the steps in an order that makes sense and will create a usable recipe. Afterwards check the answer at the end of this chapter.

1. Rinse the rice until the water is almost clear.
2. Separate 100g of rice.
3. Cover the pot with a lid and put it on the stove at a high temperature.
4. Cook for 8 minutes.
5. Serve the rice.
6. Remove the pot from the stove.
7. Add 200ml of salted water to the pot so that the rice is covered.
8. Add rice to a pot.
9. When water starts to boil, decrease the temperature.
10. If the rice is too hard, add more water and cook for 2 more minutes.
`,

  "cf1-d": `A programming paradigm is the way a programming language is classified based on its style and features.
In this section, we will look at a high-level introduction to programming paradigms to make sure you're well set up for what's to come. Once you start learning specific languages, you'll go deeper into their respective programming paradigm.

| Paradigm | Short description | Programming language |
|----------|-------------------|----------------------|
| Imperative / Procedural | Programs written as sequences of statements that modify program state step by step. You always explicitly tell the computer what to do.<br><br>[Do this] → [Then this] → [Then this] | C, Pascal, Fortran, Python, JavaScript |
| Object-Oriented (OOP) | Organizes data and behavior into objects; enables reuse of the code. Usually used to represent real-world entities.<br><br>[Car] -> car.drive()<br>[Person] -> person.getName() | Java, C++, Python, Ruby, JavaScript |
| Functional | Transformation expressed by evaluation of functions, avoiding mutable state and side-effects. You give the transformation as input but do not tell how to use it (it is known by the function).<br><br>[Functions] -> map(n => n+n)<br>.filter(n => n % 2 === 0)<br>.collect(n => new Array) | Haskell, Lisp, Erlang, F#, JavaScript |
| Logic / Declarative | Specifies what to compute using logical relations rather than step-by-step instructions. You tell facts and which rule to use, then the program knows what to do.<br><br>[Facts] -> age(Julia, 15)<br>age(Jim, 19)<br>[Rule] -> allowedIn(name): age(name) >= 18<br>[Query] -> allowedIn(Julia)<br>allowedIn(Jim) | Prolog, Datalog |
| Concurrent / Parallel | Multiple computations run concurrently, interacting and synchronizing as needed.<br><br>[Task 1] -> cookEgg()<br>[Task 2] -> toastBread()<br>[When both tasks  are done] -> eatBreakfast() | Go, Erlang, Java, Clojure |

Note: Table content paraphrased from Sebesta, R. W. (2021). Concepts of Programming Languages, 12th Edition, Pearson.

You may have noticed that some programming languages are listed multiple times - these languages are multi-paradigm: Meaning they provide different tools or features to solve a problem. It's up to the programmer to choose the style that fits their case/task. For example, you might use"procedural code" for simple tasks or "objects" to model real-world entities.
For now, we're only focusing on the paradigms for JavaScript.
`,


  "cf5-intro": `In the following pseudocode we see that an instruction or a block of instructions might be executed according to states, it means decisions in the code can be made based on conditions, which could even be a chain of conditions.

\`\`\`jsx
IF rice is too hard THEN
	ADD more water and cook for more 2 minutes
ELSE
	GET pot from the stove (it means rice is ready)
END IF
\`\`\`
`,

  "cf5-a": `In this context, If and Else statements fulfill this work very well. In JavaScript we could write the above pseudocode like this:

\`\`\`jsx
if (isRiceHard) {
  addWater();  cook(2);
} else {
  getPot();
}
\`\`\`

> 👉 Read [this guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#:~:text=Use%20the%20,false) to learn more about If and Else statements.
`,

  "cf5-b": `📝Exercise: Check the number
Write an if statement that checks if a number n is positive, negative, or zero, and logs an appropriate message.
`,

  "cf5-c": `Another way to control the flow of your program is using a switch, where you give the possible case conditions for an expression.

> 👉 Example:

\`\`\`jsx
switch (day) {
	case "Mon":
		console.log("Start of week");
		break;
	case "Fri":
		console.log("End of work week");
		break;
	default:
		console.log("Midweek");}
\`\`\`

In this case we have 2 possible case conditions and a default case for the variable "day".
`,

  "cf5-d": `👀 Optional video resource

Watch the following video for a deeper understanding of the Switch Statement:

[JavaScript Switch Statement – Overview (YouTube)](https://youtu.be/z2fcWdoph4U?list=PLZPZq0r_RZOO1zkgO4bIdfuLpizCeHYKv)
`,

  "cf5-e": `📝Exercise: Print the season given the month
Taking into account the seasons and the corresponding months, write a switch statement to evaluate a variable "month" as a number and print the corresponding season. Add a default case with a proper error message in case "month" is not a valid month.

* Months of winter: 12, 1, and 2.
* Months of spring: 3, 4, and 5.
* Months of summer: 6, 7 and 8.
* Months of fall: 9, 10 and 11.

In addition to that, try to group the cases instead of writing the code blocks for each case condition.
`,

  "cf6-intro": `In coding it is quite common to have instructions that need to be continuously repeated either for a specific amount of times or until a certain condition is fulfilled. We know such loops from our daily lives as well, for example when hanging up our clean laundry to dry: It isn't one single action. We need to take one garment and hang it up. Then we take the next one, hang it up, and so on and so forth, until all garments are hung and the laundry basket is empty (hence, the condition is fulfilled).
In coding we have two ways to perform such loops: while-loop or for-loop.
`,

  "cf6-a": `In a while-loop, a code block is executed while a condition is fulfilled, meaning that when the condition is checked the result is true. In this case, the number of interactions is usually unknown and the condition is based on a state. So, while that state is unchanged, the code block inside this loop is executed on loop (i.e. repeatedly). This is very important to understand, because it can end up in an infinite loop.

☝️ Therefore, always check if the while-loop has a possible end.

Use while-loop when you need to execute a block of code while a condition or state is unchanged.

> 👉 Example:

\`\`\`jsx
// in this example we stir the soup while the soup is not ready (i.e. for 8 minutes)
let cookingTime = 1;
let isSoupReady = false;while (!isSoupReady) {
  console.log("Cooking time:" + cookingTime);  console.log("Stir soup!");  cookingTime ++;
  if(cookingTime > 8) {
    isSoupReady = true;
  }}
console.log("Soup is ready!");
\`\`\`
`,

  "cf6-c": `📝Exercise: Invert the number
Take the number 5831 and use a while-loop to reverse it, meaning to return it to 1385. Hint: This is a regular decimal number (base-10 integer).
`,

  "cf6-d": `In a for-loop, the code block is executed for a specific (known) number of interactions or while a collection (i.e. an array) contains items.

Use for-loop when you need to execute a block of code based on a counter or a sequence.

💡Deep Dive: The previous example with while-loop would be better written in a for-loop. Do you know why?

> 👉 Example:

\`\`\`jsx
// here we stir the soup for 8 minutes (while it is cooking)
for (let cookingTime = 1; cookingTime <= 8; cookingTime++) {
  console.log("Cooking time:" + cookingTime);  console.log("Stir soup!");}
console.log("Soup is ready!");
\`\`\`
`,

  "cf6-f": `📝Exercise: Sum up the numbers
Use a for-loop to sum all numbers from 1 to 10 and log the result.
`,

  "cf7-intro": `Earlier, we learned about primitive values, like number and string.
Now we will learn about more complex data types, the so-called data structures:
These are collections used to organize and store values, which often have a relationship between one another. Working with data structures will not only allow you to access and manipulate data more efficiently, it will also improve the organization of your code.

☝️The main focus of this section is really the type of data collections, meaning how the data is stored and manipulated, and not on the data itself, which can be of any type.
`,

  "cf7-a": `An array is an ordered, list-like collection that stores multiple values in a single variable. Think of it as a sideboard with drawers; each drawer can hold a value and can be accessed by knowing its position in the sideboard. This position is called index and start with 0, not 1.

> 👉 For example, a dresser with 4 drawers will have the indexes 0, 1, 2 and 3:
> **array[4] -> array[0], array[1], array[2], array[3]**

![Array diagram](/src/assets/array.png)

Let's assume you keep your clothes in this dresser. This is how you would declare an array and access each clothing item via its index:

\`\`\`jsx
const clothes = ["jacket", "jeans", "shirt", "underwear"];
console.log(clothes[1]);      // "jeans"
console.log(clothes[3]);      // "underwear"
\`\`\`

Besides that a value in an array can also be another array, like:

\`\`\`jsx
const clothes = [["jacket", 3], ["jeans", 5], ["shirt", 7], ["underwear", 1]];
console.log(clothes[1][1]);      // 5
console.log(clothes[3][1]);      // 1
\`\`\`

When each element in an array is another array of the same size, you call it a matrix, like in this example using a matrix 3x3.

\`\`\`jsx
// matrix 3x3
const clothes = [["jacket", "blue", 1], ["jeans", "black", 3], ["shirt", "white", 3]];
\`\`\`

In JavaScript an array already contains some built-in functions that can be used to manipulate the data within the array.

\`\`\`jsx
const clothes = ["jacket", "jeans", "shirt", "underwear"];clothes.push("socks");    // add element to the end
console.log(clothes.length);       // size of the array -> 5
const clothingLengths = clothes.map(clothes => clothes.length);  // map each clothing to its number of characters
console.log(clothingLengths);       // [6,5,5,9,5]
\`\`\`
`,

  "cf7-c": `📝Exercise: Filter the numbers
Create an array of numbers and use filter() to create a new array containing only the even numbers.
`,

  "cf7-d": `📝Exercise: Map the adults of the family
Given the array representing a family, find and print only the names of the adults.

\`\`\`jsx
const family = [
  "Mary", 65, [
    ["John", 32, []],
    ["Luca", 0, []],
    ["Sarah", 42, []],
    ["Jim", 17, []],
  ]
];
\`\`\`

☝️ Instructions:

* Do not hardcode the access to a specific person by index. It should work with any array afterwards.
* We count an adult as 'equals or older than 18'
* Mary is 65 and has 4 children
* John is 32 and has no children
* Sarah is 42 and has no children
* Jim is 17 and has no children
`,

  "cf7-e": `A stack is a collection of values from which you can only add or remove a value from the *top*, similar to a stack of plates for example.

This process of adding or removing a value from the top is called **LIFO** (**L**ast **I**n -> **F**irst **O**ut)

☝️**It's important to note, that the implementation of Stacks is also made with Array and its built-in functions, so we do not use a new keyword for this at this moment.**

> 👉 Example: Imagine there's a pile ("stack") of plates in the kitchen and it's your turn to do the dishes. The pile in front of you is made up of 3 dirty plates:

![array[3] -> array[0], array[1], array[2]](/src/assets/stack-1.png)

Just as you want to start washing them, someone brings you another dirty plate, which you add to the pile (plate 3):

![array[4] -> array[0], array[1], array[2], array[3]](/src/assets/stack-2.png)

Now, logically you've put the plate *on top* of the pile. Also logically, once you start washing the plates, you'll first take the plate on top of the pile and not from the middle or the bottom of the pile, as the whole stack will fall otherwise:

![array[3] -> array[0], array[1], array[2]](/src/assets/stack-3.png)

Let's simulate this example in Javascript:

\`\`\`jsx
// Initial state of the stack
let plateStack = ["Plate1", "Plate2", "Plate3"];

// New plate is added to the stack
plateStack.push("Plate4");
console.log(plateStack); // "Plate1", "Plate2", "Plate3", "Plate4"

// Plate on top from Stack is removed
let outFromStack = plateStack.pop();
console.log(outFromStack); // "Plate4"
console.log(plateStack); // "Plate1", "Plate2", "Plate3"
\`\`\`

☝️**The Array functions *push()* and *pop()* are used to add or remove from the stack respectively.**

But when should you use a Stack?

Use it in cases where you need to manipulate data in the *reverse* order in which they arrived. Meaning, the last value to arrive to the stack, will be the first one to be manipulated.
`,

  "cf7-g": `📝Exercise: Web browser navigation
Suppose you have visited the following websites in this order:

* http://www.fun.happy
* http://www.shopping.com
* http://www.code-blossom.com
* http://www.games.com
* http://www.books.me

Implement a simple navigation system, simulating the clicks at back and forth buttons, like below:

* back, back, forth, back, back, back, forth, forth.

Simulate also visiting a 6th website: http://www.my.website.

* Log the websites according to each click or visit.
`,

  "cf7-h": `A Queue is a collection of values to which you add new values to the back of the queue and remove them from the front, just like in a line at the supermarket. This process of adding a value to the back and removing them from the front is called FIFO (First In -> First Out).

☝️Important to note here, is that the implementation of Queues in this section is also made with Array and its built-in functions, so we do not use a new keyword for that at this moment.

> 👉 For example, imagine a line ("queue") at a supermarket checkout:
> There are three people in that line:

![array[3] -> array[0], array[1], array[2]](/src/assets/queue-1.png)

Then comes a fourth person, who joins at the end of the line:

![array[4] -> array[0], array[1], array[2], array[3]](/src/assets/queue-2.png)

The person at the front of the line, is the first who gets to pay and therefore leaves the queue. So now, the queue shifts, with the next person in line moving up:

![array[3] -> array[0], array[1], array[2]](/src/assets/queue-3.png)

Let's simulate this example in Javascript:

\`\`\`jsx
// Initial state of the queue
let checkoutQueue = ["Sarah", "Mike", "Ana"];

// New person comes to the queue
checkoutQueue.push("Jim");
console.log(checkoutQueue); // "Sarah", "Mike", "Ana", "Jim"

// First person in Queue leaves
let outFromQueue = checkoutQueue.shift();
console.log(outFromQueue); // "Sarah"
console.log(checkoutQueue); // "Mike", "Ana", "Jim"
\`\`\`

☝️Use the Array functions push() and shift() to add or remove from the queue respectively.

But when should you use a Queue?

Use it when you need to manipulate data in the same order they arrive, meaning the first value to arrive is the first one to be manipulated.

💡Deep Dive: Now that you know how to implement Stack and Queue, which one do you think is more costly in terms of performance and why?
`,

  "cf7-j": `📝Exercise: Printer queue
You are implementing a very simple printer queue at your office. The following files were already sent to the printer in this order:

* Monthly_Report.pdf
* Vacation_Photos.jpg
* Receipt_123.png

After the first file is printed, a new one is added to the queue:

* Statistics_data.json

In the end all files must be printed.

Create a simulation that logs the name of each file when printed and the current printer queue.
`,

  "cf7-k": `An object is a collection of the so-called key-value pairs, just like in a dictionary, where a word is the key and its definition is the value.

> 👉 For example, we could list a person with some key-value pairs:

\`\`\`jsx
let person = {
  name: "Sarah",
  age: 30,
  occupation: "Software Engineer"
};
\`\`\`

☝️ You might hear a key-value pair be called an attribute or property. Like "age" as an attribute or a property of a person (object).

To read the attributes of this person (object) you can simply type the key:

\`\`\`jsx
console.log(person.name); // Sarah
\`\`\`

Technically, you could also represent that person as an array. But an object is easier to use, because, as opposed to the Array, you don't need to know the exact index. So choose wisely which data structure is best for your data.

Also note that,, a value in an object can be another object, like:

\`\`\`jsx
let person = {
  name: "Sarah",
  age: 30,
  occupation: "Software Engineer",  address: {
    street: "5th Avenue",
    number: 150
  }
};

console.log(person.address.street); // 5th Avenue
\`\`\`
`,

  "cf7-m": `📝Exercise: Library
Implement a simple library program for the following book Object:

\`\`\`jsx
let book = {
  title: "JavaScript Chapter",
  author: "Code Blossom",
  isAvailable: true,
  readerCount: 148,
  isPopular: false
};
\`\`\`

Instructions:

1. When the book is borrowed, isAvailable becomes false and readerCount is incremented
2. When readerCount is equals or greater than 150, isPopular becomes true
3. Simulate the following story:
   1. Client "Ana" asks if the book is available
   2. Then Client "Ana" borrows the book
   3. Then Client "Mary" asks if the book is available
   4. Then Client "Ana" returns the book
   5. Then Client "Mary" asks if the book is available
   6. Then Client "Mary" borrows the book
4. In each step, log the action and the book
`,

  "cf8-a": `A function is a piece of code used to perform a specific task. It lets you group code blocks into small, reusable units (so-called encapsulation), which will help you avoid code duplication and improve the structure of the program.
In practice this means that you can define a function once and then "call" it, whenever you need to fulfil that task.
Think of your code as a lego, made of multiple pieces of code, such as functions.
Now, just as in real life, when performing a function (a task) you might need inputs, so called parameters, and/or you might need to return an output.

Defining a function

To define a function, you start with the keyword function, followed by the function name, and then a pair of parentheses (). Inside the parentheses, you add any parameters the function needs. This makes the signature of the function. The code to perform the desired task goes into the function body, meaning inside the curly braces { }.
If your function needs to return a value, then use the keyword return followed by the output.

> 👉 Example:
>
> \`\`\`jsx
> function greet(name) {
>   return "Hello, " + name + "!";
> }
> function greetEveryone() {
>   return greet("everyone");
> }
> \`\`\`

Calling a function

To call the function, simply write the function name, followed by the necessary parameters or empty parenthesis.
You may not have noticed but you've already been using functions during the course of this chapter. The built-in function log(). You have been using it to print a message into the console by writing: console.log("any text"). In this case, log() is a function provided by the object console, so all the necessary logic used to print a message already comes with the function, you just give the text as a parameter.

> 👉 Example:
>
> \`\`\`jsx
> console.log(greet("Bob")); // "Hello, Bob!"
> console.log(greetEveryone()); // "Hello, everyone!"
> \`\`\`

Taking again our rice cooking example, we could write the following functions:

\`\`\`jsx
function addWater(saltedWater) {
  // add water to the pot
}
function cook(timeInMinutes) {  // wait for timeInMinutes}
\`\`\`

Now that we've defined these functions, we can call them whenever we need them throughout the recipe.

\`\`\`jsx
// in the code for recipe
addWater(saltedWater);
cook(8);
if(isRiceHard) {
  addWater(saltedWater/2);
  cook(2);
}
\`\`\`
`,

  "cf8-c": `📝Exercise: Write the rice recipe in JavaScript
Now that you know about variables, control flow and functions, write our rice recipe (from the algorithms section) in JavaScript.
Some tips:

* Print messages to simulate manual actions and results, like "rice added to the pot", "rice is still hard", "pot removed from the stove", etc.
* For waiting time (i.e. during cooking), simply use a loop printing a message to simulate it. In a later section you will learn a proper method for "wait".

In the end your code should have, along with other possible functions, a main function called cookRice(amountOfRice). This is the one to be called in the console with the given amount of rice.
`,

  "cf8-d": `A recursive function is a function that calls itself to repeat an action until a certain condition is met.
You can think of it as a function that keeps repeating something over and over infinitely. Which is why it must know when to stop, otherwise it will keep running forever.

> 👉 Example:
>
> \`\`\`jsx
> function countdown(number) {
>   if (number <= 0) {
>     console.log("Done!");
>     return; // stop when the number reaches 0
>   }
>   console.log(number);
>   countdown(number - 1); // it calls itself again
> }
> countdown(3);
> // Output:
> // 3
> // 2
> // 1
> // Done!
> \`\`\`

It's important to understand that when a recursive function calls itself, the execution that was currently running will pause. Once the inner call of the recursive function finishes, the previous execution will continue where it stopped (paused). For example, adding a log message after the recursive call shows when it comes back and which scope it has:

\`\`\`jsx
function countdown(number) {
  if (number <= 0) {
    console.log("Done!");
    return; // stop when the number reaches 0
  }
  console.log(number);
  countdown(number - 1); // it calls itself again, current execution pauses
  console.log("Back from the recursive loop: number is " + number);
}
countdown(3);
// Output:
// 3
// 2
// 1
// Done!
// Back from the recursive loop: number is 1
// Back from the recursive loop: number is 2
// Back from the recursive loop: number is 3
\`\`\`

💡 Deep Dive: You can calculate the sum of numbers from 1 to N using either a loop (iteration) or a recursive function. Do you know which one is safer and thus more appropriate?
`,

  "cf8-f": `📝Exercise: Tracking the execution flow
Given the code below, find out what the final result is when calling the function with parameter 6.
☝️ Important: Perform this exercise on paper or in your mind by iterating the execution of the function. Do not run the code in the console.

\`\`\`jsx
function myFunction(n) {
  if (n <= 1) {
    return 1;
  }

  let result = n + myFunction(n - 2);
  return result;
}

let finalResult = myFunction(6);
\`\`\`
`,

  "cf8-g": `📝Exercise: Count the family members
Given the object representing a family, print the size of the family and each name.
☝️ Instructions:

* Do not hardcode the access to a specific person by index

\`\`\`jsx
const family = {
  name: "Mary",
  age: 65,
  children: [
    {
      name: "John",
      age: 32,
      children: [
        {
          name: "Amina",
          age: 5,
          children: []
        },
        {
          name: "Jessica",
          age: 9,
          children: []
        }
      ]
    },
    {
      name: "Luca",
      age: 0,
      children: []
    },
    {
      name: "Sarah",
      age: 42,
      children: [
        {
          name: "Mike",
          age: 20,
          children: [
            {
              name: "Maria",
              age: 1,
              children: []
            }
          ]
        }
      ]
    },
    {
      name: "Jim",
      age: 17,
      children: []
    }
  ]
};
\`\`\`
`,

  "cf9-a": `When talking about variables there is a very important concept you need to understand: scope.
Basically a variable's scope is where this variable is visible and allowed to be used. We will focus on the two main JavaScript scopes for now: Global and Local.

1. Global: The variable is accessible everywhere in your code.
2. Local: the variable is only accessible inside the brackets where it is defined, for example inside a function or code block.

> 👉 Example:
>
> \`\`\`jsx
> let globalVariable = "visible everywhere";
> function myFunction() {
>   let localVariable = "not visible outside this function";
>   console.log("IN FUNCTION: " + globalVariable); // it prints the text
>   console.log("IN FUNCTION: " + localVariable); // it prints the text
> }
> myFunction();
> console.log("OUT FUNCTION: " + globalVariable); // it prints the text
> console.log("OUT FUNCTION: " + localVariable); // it returns an error
> \`\`\`

☝️ It is important to understand the following:

* Global scope is bigger than local scope.
* A variable is accessible in the scope where it is defined and also in any nested scope.
* The reverse does not work, because a variable is never accessible outside or above its scope, barring one exception, which is when using var (see section about variables).

Think of scopes as boxes inside bigger boxes. A variable is accessible in the box where it lives and all the boxes inside of it but nowhere else.

> 👉 Example:
>
> \`\`\`jsx
> let globalVariable = "visible everywhere";
> function myFunction() {
>   let localVariable = "visible inside this function";
>   if(true) {
>     let localBlockVariable = "visible inside this code block";
>     console.log("IN BLOCK: " + globalVariable); // it prints the text
>     console.log("IN BLOCK: " + localVariable); // it prints the text
>     console.log("IN BLOCK: " + localBlockVariable); // it prints the text
>   }
>   console.log("IN FUNCTION: " + globalVariable); // it prints the text
>   console.log("IN FUNCTION: " + localVariable); // it prints the text
>   console.log("IN FUNCTION: " + localBlockVariable); // it returns an error
> }
> myFunction();
> \`\`\`
`,

  "cf9-c": `📝Exercise: Playing with scopes
What does the following code print and why?

\`\`\`jsx
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("value: " + i), 100);
}
\`\`\`

And what does this code print and why?

\`\`\`jsx
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log("value: " + i), 100);
}
\`\`\`
`,

  "cf9-d": `📝Exercise: Improve the code
How would you improve the following code in regards to variable scopes?

\`\`\`jsx
function counter() {
  for (var i = 0; i < 3; i++) {
    var count = i * 2;
  }
  return count;
}

console.log(counter());
console.log(i);
\`\`\`
`,

  "cf9-e": `📝Exercise: Fix the code
Fix the following code which is syntactically broken:

\`\`\`jsx
var num = 1;

function outer() {
  var num = 2;

  function inner() {
    num += 1;
    let num = 3;
    console.log("Inner num:", num);
  }

  inner();
  console.log("Outer num:", num);
}

outer();
console.log("Global num:", num);
\`\`\`
`,

  "cf10-a": `As we learned, JavaScript can be embedded in a web page, written in HTML. When a web page is loaded and interpreted by a web browser, it creates a representation of that web page as a tree of objects, called DOM (Document Object Model), which can be accessed in JavaScript. Meaning that in JavaScript you can change the content, structure and style of a web page by manipulating its DOM.
However it is advisable to first understand HTML, so you can better interact with its tree. Therefore in this section you will only learn some very basic ways of DOM manipulation, like which object and functions to use.
The DOM is accessible in JavaScript via the object document. Like any other object, it contains properties and built-in functions, which might give back an element of the page.

> 👉 For example check the following simple HTML with embedded JavaScript:
>
> \`\`\`html
> <!DOCTYPE html>
> <html>
> <body>
>
>   <p id="textParagraph">Hello, I am an evolving paragraph!</p>
>
>   <script>
>   // get the paragraph by ID
>   const textParagraph = document.getElementById("textParagraph");
>
>   // change the text after 2 seconds (2000 milliseconds)
>   setTimeout(function () {
>     textParagraph.textContent = "I just evolved! :)";
>   }, 2000);
>   </script>
>
> </body>
> </html>
> \`\`\`

Copy the code to a file with an .html extension, like mypage.html, and then open the file in a web browser.
`,

  "cf10-c": `📝Exercise: DOM manipulation
Given the following HTML, write JavaScript code to log the page title in the console, change the page title, and change the background color.

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>

  <script>
    // YOUR CODE GOES HERE
  </script>

</body>
</html>
\`\`\`
`,

  "cf11-a": `When coding in JavaScript for a web page, it is often necessary to do something based on what happens in the web page. For example, do something when a certain button gets clicked, when a key gets pressed or once the web page gets fully loaded.
So an element from the web page needs a way to notify the application when it receives an action. This is done by using Events.
Events are notifications from an HTML element, to tell which action just happened.
Event handling is done by registering Event listeners, so you can for example execute a certain piece of code when the respective event is fired.

> 👉 For example when a button gets clicked in a web page, it triggers an Event "click", which can be listened to by a function and do something:
> Copy the code to a file having an .html extension, like mypage.html, and then open the file in a web browser.
>
> \`\`\`html
> <!DOCTYPE html>
> <html>
> <body>
>
>   <p id="textParagraph">Hello, I am a paragraph!</p>
>
>   <button id="actionButton">Click to change text above</button>
>
>   <script>
>     // get elements by ID
>     const textParagraph = document.getElementById("textParagraph");
>     const actionButton = document.getElementById("actionButton");
>
>     // Change text when button gets clicked
>     actionButton.addEventListener("click", function () {
>       textParagraph.textContent = "Hello JavaScript!";
>     });
>   </script>
>
> </body>
> </html>
> \`\`\`

☝️ There are several possible Events to be listened to. For example, you can listen to a double click on a button. Consult this page to get to know other Events:
➡️ [DOM Events](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events)
`,

  "cf11-d": `📝Exercise: I see you!
Just like in the example, create a web page containing a paragraph and implement the following:

* Initially it shall display the text "Hello".
* It displays the text "I see you!" when the mouse cursor hovers over the paragraph.
* It displays the text "Where did you go?" when the mouse cursor leaves the paragraph.
`,

  "cf12-a": `Often we have to deal with errors and bugs coming from our code itself, input data, integration layer (like network issues), or elsewhere. Usually when such an error occurs, the application might behave wrongly (like producing wrong data) or completely stop working.
In some cases, when we know such an error can occur and we have an alternative solution, we can gracefully handle it, instead of letting the application fail. This is called Error handling.
Error handling in JavaScript uses try...catch blocks:

* try: the code inside the try block runs normally. This is the code that might fail. Think of it like the "Danger zone".
* catch: If an error occurs inside the try block, the execution stops and the control jumps to the catch block. Think of it like the "Emergency room".

☝️ Important to know that errors thrown in the code are also called Exceptions in coding.

> 👉 For example when using a variable that was not defined before, it throws an error called ReferenceError:
>
> \`\`\`jsx
> try {
>   console.log(variableNotDefined);
> } catch (error) {
>   console.error(error);
> }
> \`\`\`

☝️ As a best practice, only keep the code that might fail inside the try block. Do not add extra code, otherwise it might be difficult to know exactly where the error comes from.

> 👉 But when do we implement Error handling?
>
> * When working with data you don´t own, like user input or a file.
> * When communicating with the external world (external API, Database, etc).
> * To show user friendly error messages when things go wrong.
> * Temporarily for debugging.

> 👉 Most importantly, when not to do it?
>
> * When there is a bug in the code, fix it. Do not hide it in a try...catch block.
> * When you know which error can occur and can avoid it by doing a validation. For example by cleaning and validating input data before an arithmetic operation.

The "Housekeeping" block:
There is also a code block used as "Housekeeping", which is always executed after try…catch. It is called finally.
Finally can be added after try…catch block or after try block in case there is no catch block.
It is always executed after the code in the try or catch block finishes executing.

> 👉 Example:
>
> \`\`\`jsx
> try {
>   console.log("any text to log");
>   return;
> } catch (error) {
>   console.log(variableNotDefined);
> } finally {
>   console.error("Executing 'finally' code after try or catch block");
> }
> console.log("Executing 'simple' code after try or catch block");
> \`\`\`

In this example, the code in the finally block is always executed:

* Even when we use the "return" inside the try block.
* Even when an error occurs inside the catch block.

However, the "simple" code after isn't executed in any of these cases.

> 👉 So when do we use the housekeeping block?
> It is usually used to do some cleanup, like releasing resources (for example Database connections, closing an opened file, etc) or changing some state based on the logic in the try…catch. That's why you can think of it as "Housekeeping".

💡 Deep Dive: In case there is a return statement inside a try block and another inside the finally block, which one is the "winner" and gets returned?
`,

  "cf12-c": `📝Exercise: The ATM simulator
Write a simple ATM program, simulating the withdrawal of money using try…catch…finally and consider the following:

* It should always eject the bank card in the end, no matter what happens.
* It should log each step, including errors.
* In case a user tries to withdraw more money than is available, it should log an error. Otherwise it should succeed.
* Current available balance should get updated.
* Consider this code template:

\`\`\`jsx
let accountBalance = 100;

function withdrawMoney(amount) {
  console.log("Transaction started...");

  // your code comes here
}

// Test cases
withdrawMoney(50);  // Withdraw should succeed and eject card
withdrawMoney(200); // Withdraw should fail but still eject card
\`\`\`
`,

  "cf13-a": `OOP is a programming paradigm as mentioned in Section 1 and it's very important for many programming languages, like Java, Python and JavaScript. It focuses on representing real-world things as objects, like their digital versions, so you don't think only about instructions and procedures anymore, but in things.

> 👉 Example:
> Take a look at this code written in a procedural style:
>
> \`\`\`jsx
> // Data
> const myAccount = { type: 'savings', balance: 100 };
>
> // Procedure
> function withdraw(account, amount) {
>   // We must use if/else to check the type and apply different rules
>   if (account.type === 'savings') {
>     account.balance -= (amount + 5); // Savings has a fee
>   } else {
>     account.balance -= amount;      // Standard has no fee
>   }
> }
>
> withdraw(myAccount, 20);
> console.log(myAccount.balance); // 75
> \`\`\`

☝️ We can notice some aspects about it:

* The data has no "knowledge" of its own behaviour, it means, it is not bound to its functions.
* The data is not "safe" or "protected", it's out in the open and anything can access and update it directly.
* Usually there is a standalone function that handles all the logic.
   * For different behaviour, usually we need a chain of if/else

Now, look at the same but in OOP:

\`\`\`jsx
class Account {
  #balance; // Private data

  constructor(amount) { this.#balance = amount; }

  // Simple interface, complex math is hidden

  withdraw(amount) { this.#balance -= amount; }

  get balance() { return this.#balance; }
}

// SavingsAccount "is an" Account
class SavingsAccount extends Account {
  // Same method name, different behavior (adds fee)
  withdraw(amt) { super.withdraw(amt + 5); }
}

const myAcc = new SavingsAccount(100);
myAcc.withdraw(20);
console.log(myAcc.balance); // 75
\`\`\`

We can also identify some distinct elements here:

* New syntax class, which is used to define the skeleton, template or blue-print for an object. Introduced in ES6+ (discussed in the next Section).
* The # makes the variable private, it means that it's only directly accessible from the scope where it is declared. In this case, #balance is a private variable in the class Account. In this case, you can say the data is encapsulated.
* The complexity of the function is hidden in the class. Only a simple and understandable function is exposed, not the details. So the user of this class only sees what the object does, not how it does it. This is called abstraction.
* You can extend a class by creating a new type of it, which inherits properties and functions from the parent class. This is called inheritance.
* You can add a different behavior to the same function in a subclass. This is called polymorphism.
* You can create (or instantiate) as many objects of a class as needed. You do that by implicitly calling the constructor via the new keyword, for example new SavingsAccount(100).

☝️ Here we notice the main concepts in OOP: encapsulation, abstraction, inheritance and polymorphism.
Let´s take a look at each one below.
☝️ The idea is not to say OOP is better than another paradigm, like Procedural. Each paradigm has its use, so choose the most adequate for your usecase.
`,

  "cf13-b": `It´s all about data integrity. You keep the data where it belongs and only the owner of it can have direct access and control it, establishing a boundary. So you can also say that data is an internal state of the owner.
In practice it prevents side effects, like a class updating a property incorrectly from another class, and also helps organize your code and debug it.
In our previous example we have the variable balance (data) and the class Account (owner), and balance is only set and updated inside Account.
Another classic example would be by representing an animal, where its property is safe and not directly accessed.

\`\`\`jsx
class Animal{
  #name;
  constructor(name) {
    this.#name = name;
  }

  get name() { return this.#name; }
}

var animal= new Animal("Buddy");
console.log(animal.name); // Buddy
\`\`\`
`,

  "cf13-c": `It's all about focus and simplicity. You focus on what the object does, not how it does it. You expose only what is necessary, hiding the complexity behind a simple interface.
This way, you decouple your class from others as much as possible, which improves usability and maintainability.
In our example the class Account exposes the function withdraw, which is very clear, simple, and hides the complexity from the user. The user does not need to know how the function works in case of SavingsAccount or standard Account.
Also in the animal example, we can see that the implicit getName function is part of the animal interface, as well as other functions, like eat, breathe, move, and so on.

\`\`\`jsx
class Animal{
  #name;
  constructor(name) {
    this.#name = name;
  }

  get name() { return this.#name; }

  eat() {
    console.log("The animal is eating");
  }

  breathe() {
    console.log("The animal is breathing");
  }

  move() {
    console.log("The animal is moving");
  }
}

var animal= new Animal("Buddy");
console.log(animal.name); // Buddy
animal.eat(); // The animal is eating
animal.breathe(); // The animal is breathing
animal.move(); // The animal is moving
\`\`\`
`,

  "cf13-d": `It's about reuse and hierarchy. Instead of writing the same code over and over for different types of objects, you create a general 'Parent' class with the basic features. Then, 'Child' classes inherit all those features automatically. So you have a family of classes. This creates an 'Is-A' relationship. For example, a Savings Account is an Account.
This saves time and keeps your code organized because any change you make to the parent automatically updates the children.
Continuing with the animal example, we could represent the animals in a hierarchical family. It could be for instance represented with an Animal parent class, followed by Mammal, Bird, and so on as child classes. From Mammal you can derive other types, like Dog, Cat, Whale, etc. All these mammals would inherit the same functions.

\`\`\`jsx
class Animal{
  #name;
  constructor(name) {
    this.#name = name;
  }

  get name() { return this.#name; }
}

class Mammal extends Animal {}

class Dog extends Mammal {}

class Cat extends Mammal {}

class Whale extends Mammal {}

var myDog = new Dog("Pluto");
console.log(myDog.name); // Pluto
\`\`\`
`,

  "cf13-e": `It's about flexibility. It allows different classes to be treated as if they were the same type, but each one responds to the same command in its own way. Even though a standard Account and a SavingsAccount both have a withdraw function, the logic behind them is different.
This way, you don't need to know which specific type the object is, you just call the same method and the object handles its own unique rules.
So Polymorphism goes hand in hand with Inheritance. Taking the animal example from Inheritance, what would happen if we need to represent the sound the animals make? Each type of animal makes a different sound, so they cannot just inherit the same behaviour. In this case, polymorphism helps by adding different behaviour to the same function.

\`\`\`jsx
class Animal{
  constructor(name) {
    this.name = name;
  }

  makeSound() {
    console.log("The animal makes a generic sound");
  }
}

class Mammal extends Animal {
  makeSound() {
    console.log("The mammal makes a generic sound");
  }
}

class Dog extends Mammal {
  makeSound() {
    console.log("Woof! Woof!");
  }
}

class Cat extends Mammal {
  makeSound() {
    console.log("Meow!");
  }
}

class Whale extends Mammal {
  makeSound() {
    console.log("Oooooooonnnn!");
  }
}

var mammals = [new Dog(), new Cat(), new Whale()];

mammals.forEach(mammal => {
  mammal.makeSound(); // same function, but get different results
});
\`\`\`
`,

  "cf13-h": `💡 Deep Dive: If a Parent class has a private field #secret, and a Child class tries to create its own private field with the exact same name #secret, is this a conflict? Does the Child inherit the Parent's private data, or is it completely blind to it?

📝Exercise: OOP in action
Create a simple representation of smartphones considering the follow:

* There are two types of smartphones: iPhone and Samsung.
* Both smartphones have the same interface, made of two functions:
   * useApp(appName)
   * chargeBattery() -> charges the battery level back to 100%
* By first start up, the battery level is 100%.
* Every time the iPhone is used, it needs 10% of battery.
* Every time the Samsung is used, it needs 5% of battery.
`,

  "cf14-intro": `ES6 was a big update in JavaScript, bringing a lot of new features, turning it to a more sophisticated language. It stands for ECMAScript 2015 and ES6+ refers to any update since ES6, for example ES7, ES8, and so on.

☝️ Note: Here we cover only features not yet mentioned throughout the Chapter.
`,

  "cf14-a": `So far you have been using arrays to represent a collection and might have noticed that you can add the same data repeated times without a problem. But what if you need a collection that allows only unique values? You could implement that by hand but in ES6+ a new data structure was introduced for this case, called Set.
Set is a collection of unique values. Any attempt to add a duplicated value is ignored.
To create a Set, you use the new class Set, just like instantiating an object. Then you use the existing functions to manage the collection.

> 👉 Example:
>
> \`\`\`jsx
> const mySet = new Set();
>
> mySet.add(1);
> mySet.add(5);
> mySet.add(5); // This is ignored!
>
> console.log(mySet); // Set { 1, 5 }
>
> console.log(mySet.has(1)); // true
> \`\`\`

💡 Deep Dive: If you are implementing the shopping cart of an ecommerce, should you use an Array or a Set for the selected products? Why?

💡 Deep Dive: Set is more efficient than Array when checking if a collection contains a certain value. For example, if you have a collection of 1 million IP Addresses and you need to check if the collection contains a specific IP address, a Set is far more efficient than an Array. Why?
`,

  "cf14-c": `Previously you learned about Object and how to model something like a Person as Object.

> 👉 Example:
>
> \`\`\`jsx
> let person = {
>   name: "Sarah",
>   age: 30,
>   occupation: "Software Engineer"
> };
> \`\`\`

In this case you know the structure of the object, at least the basic properties.

* But what if you don't know that beforehand?
   * You can still do it with Object but that's not what it is designed for, hence it will not perform so well..
* What if you need the key of the property to be a number or any other type besides a string?
   * This cannot be implemented with Object, as the key in Object must be a string.
* What if you need to guarantee the order of the properties?
   * In Object it is not guaranteed.

To rescue you in these cases the new data structure Map was introduced in ES6+. Map is a collection of key-value pairs, just like a dictionary, in which you just need to instantiate an object of this class and use its built-in functions.

> 👉 Example:
>
> \`\`\`jsx
> const mixedMap = new Map();
> const myFunc = () => {};
>
> mixedMap.set(123, "I am a number key");
> mixedMap.set(myFunc, "I am a function key");
> mixedMap.set("abc", "I am a string key");
>
> // When you loop, it's ALWAYS in the order you set them
> for (let [key, value] of mixedMap) {
>   console.log(\`\${key} is for \${value}\`);
> }
> \`\`\`

☝️ You can think of Object as a Record and Map as a Collection.

💡 Deep Dive: Map has another advantage over Object regarding initial state. What is it?
`,

  "cf14-b": `📝Exercise: Removing duplicates
Use a Set to remove the duplicates of the following array:

\`\`\`jsx
const colors = ["blue", "orange", "blue", "yellow", "orange", "green"];
\`\`\`
`,

  "cf14-d": `📝Exercise: Better performance with Cache
A common use of Map is to implement a Cache. When you need to reuse some data that is usually costly to get created or retrieved, you can get the data once and cache it in memory, so next time you need the data, you can get it from the Cache instead of going to the data source.
Given the following code to calculate Fibonacci for a given number, improve the performance by using a Cache.
☝️ With the code below, do not calculate Fibonacci for a number higher than 40, as your computer might freeze.

\`\`\`jsx
function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

console.time("Fibonacci test");
console.log(calculateFibonacci(35));
console.timeEnd("Fibonacci test"); // Likely takes ~100ms to 500ms
\`\`\`

⚠️ The improved code to calculate Fibonacci for 35 should take less than 1ms.
💡 Deep Dive: Map has another advantage over Object regarding initial state. What is it?
`,

  "cf14-e": `You may have noticed that we often repeat the same template when writing functions: the function keyword, curly braces, and the return statement. This kind of repetitive structural code is called boilerplate.
Arrow functions help us skip the noise of some keywords and structure. They provide a shorter, cleaner way to write logic. As the name suggests, we use an arrow (=>) instead of the keyword function.

\`\`\`
( ) => { }
\`\`\`

* ( ): here you define the input arguments
* { }: here you define the logic. It can use the arguments and return a value.

Just like this

\`\`\`
(n) => {return n * 2}
\`\`\`

In case the arrow function has only one argument, the parenthesis is optional

\`\`\`
n => {return n * 2}
\`\`\`

And if the logic has only one line code, the return keyword is implicit, therefore optional, as well as the curly brackets

\`\`\`
n => n * 2
\`\`\`

☝️ Use it when the logic in the function is small and simple. For large and complex logic, write a normal function.
☝️ In other languages, like Java and Python, they are called lambdas.

> 👉 Example:
> Normal function:
>
> \`\`\`jsx
> const numbers = [1, 2, 3, 4];
>
> function doubleTheNumber(n) { // normal function
>   return n * 2;
> }
>
> const doubled = numbers.map(doubleTheNumber);
>
> console.log(doubled); // [2, 4, 6, 8]
> \`\`\`
>
> Arrow function:
>
> \`\`\`jsx
> const numbers = [1, 2, 3, 4];
>
> const doubleTheNumber= n => n * 2; // arrow function
>
> const doubled = numbers.map(doubleTheNumber); // you can pass it as variable
> const doubled2 = numbers.map(n => n * 2); // or you can pass it directly
>
> console.log(doubled); // [2, 4, 6, 8]
> console.log(doubled2); // [2, 4, 6, 8]
> \`\`\`
`,

  "cf14-f": `📝Exercise: Old to new
Rewrite the following functions using arrow functions:

\`\`\`jsx
function hello() {
  return "Hello there!";
}

function applyDiscount(price, discount) {
  return price - discount;
}

function checkStock(quantity) {
  if (quantity > 0) {
    return "In Stock";
  } else {
    return "Out of Stock";
  }
}
\`\`\`
`,

  "cf14-g": `**Spread Syntax**

Imagine you have a copy of a collection of elements and add a new element into it, like:

\`\`\`jsx
const originalCollection = [1, 2, 3];
const copyCollection = originalCollection;

copyCollection.push(4);

console.log(originalCollection); // [1, 2, 3, 4]
\`\`\`

Note that changing the copy also alters the original collection.
Spread syntax can be used in this case, as it makes a "shallow" copy of a collection.

\`\`\`jsx
const original = [1, 2, 3];
const copy = [...original]; // using spread syntax

copy.push(4);

console.log(original); // [1, 2, 3] (Safe!)
console.log(copy);     // [1, 2, 3, 4]
\`\`\`

So when you need to use spread syntax, add the (...) before the collection name. It will make a "shallow" copy of all elements and unpack them where you indicate.

☝️ By "shallow" copy it means it will copy only primitive values like strings, numbers and booleans. If the collection contains another type of value, it will not be copied but shared.

☝️ Spread is called that because you are taking an array and spreading its individual pieces into a new place.

**Rest Parameters**

Sometimes you do not want to restrict the quantity of a certain type of parameter a function can receive.

> 👉 Example:
> A function that sums the given numbers could look like this:
>
> \`\`\`jsx
> function sum(number1, number2, number3) {
>   return number1 + number2 + number3;
> }
> console.log(sum(3, 5, 12)); // 20
> \`\`\`
>
> The function could be "greedy" and flexible, by accepting any number of parameters of the same type:
>
> \`\`\`jsx
> function sum(...numbers) {
>   return numbers.reduce((a,b) => a+b, 0);
> }
> console.log(sum(3, 5, 12)); // 20 - the call works in the same way
> \`\`\`

As you can notice, you just need to add (...) in front of the variable´s name and the elements are packed into a collection.

☝️ Rest parameter must be the far right parameter in the function and a function can have only one rest parameter.

☝️ Rest is called that because it handles "the rest of the values."
`,

  "cf14-h": `📝 Exercise: The kitchen manager
Implement a restaurant management system considering the instructions and the collections:

* Implement the functions to handle a delivery and to process the order of a dish. Use spread syntax and rest parameters.
* If the order is valid, it should return a user-friendly message.
* If the order contains a component or ingredient not available, it should return a user-friendly error message.
* Use the testing template.
* The restaurant has main components, special ingredients and optional ingredients.
* Delivery: first item is mandatory and special ingredient, the rest is optional.
* A dish is made of one main component, one special ingredient and any optional ingredients, for example Steak with Saffron and Chilli.

\`\`\`jsx
// collections
const mainComponents = ["Pasta", "Steak"];

// testing
console.log(sendDelivery("Truffles", "Chilli", "Sugar"));
console.log(sendDelivery("Saffron", "Eggs", "Milk"));
console.log(sendDelivery("Fries"));
console.log(order("Steak", "Truffles", "Eggs", "Chilli")); // order submitted
console.log(order("Steak", "Truffles")); // order submitted
console.log(order("Steak", "Fries")); // order submitted
console.log(order("Rice", "Truffles", "Eggs", "Chilli")); // order invalid, Rice is not available
console.log(order("Steak", "Salad", "Eggs", "Chilli")); // order invalid, Salad is not available
console.log(order("Steak", "Truffles", "Eggs", "Pepper")); // order invalid, Pepper is not available
\`\`\`
`,

  "cf14-i": `Let´s say you have an array and want to assign each element from it to a variable:

\`\`\`jsx
const colors = ["Red", "Green", "Blue"];
let color1 = colors[0];
let color2 = colors[1];
let color3 = colors[2];
\`\`\`

That´s easy but you can see some boilerplate code.
With Destructuring it´s more straightforward:

\`\`\`jsx
const [color1, color2, color3] = ["Red", "Green", "Blue"];
console.log(color1); // Red
console.log(color2); // Green
console.log(color3); // Blue
\`\`\`

And it also works for objects:

\`\`\`jsx
const person = {
  name: "Sarah",
  age: 35
};
const {name, age} = person;
console.log(name); // Sarah
console.log(age); // 35
\`\`\`

☝️ Notice that with array you use brackets ([ ]) and with object you use curly braces ({ }) for destructuring.

☝️ As objects have a defined key name, the order of the variables in the destructuring does not matter, it means, in the example it could be {name, age} or {age, name}.
`,

  "cf14-j": `📝Exercise: Extractor
Extract, using Destructuring, the following properties from the object below:

* label
* price
* color
* reviews

\`\`\`jsx
const product = {
  id: 5001,
  label: "Spring t-shirt",
  price: 39,
  specs: {
    color: "Black",
    size: "M"
  },
  reviews: ["Great fabric", "Comfortable", "Soft"]
};
\`\`\`
`,

  "cf14-k": `It makes it easier to build a string made of other variables. No more fighting with quotes and plus signs. You write the string as a template, having a placeholder for each variable, which you add inside brackets, like \${variableName}.

> 👉 Example:
> Before ES6:
>
> \`\`\`jsx
> var item = "coffee";
> var price = 4;
> console.log("Your " + item + " will cost $" + price + ". Enjoy!");
> \`\`\`
>
> After ES6:
>
> \`\`\`jsx
> const item = "coffee";
> const price = 4;
> console.log(\`Your \${item} will cost $\${price}. Enjoy!\`);
> \`\`\`
`,

  "cf14-l": `📝Exercise: Templates
Based on the string variables below, use a single Template Literal to create a string that looks exactly like this: Joana is a Developer with 5 years of experience.

\`\`\`jsx
const firstName = "Joana";
const role = "Developer";
const yearsExperience = 3;
\`\`\`
`,

  "cf15-intro": `Now let´s talk about operations that might take very long to complete.

Imagine you work at a restaurant as a waitress/waiter and as you work your shift, you take orders from the various tables, one by one. As you submit the orders to the kitchen, you don't know how long an order will take to be ready. Some might be fast others might take long. Now, if you were to wait for the kitchen to prepare one order, before submitting the next one, your customers would end up waiting way too long, become unhappy and eventually the restaurant business would probably fail.

This is why, of course, you take orders from clients, submit them to the kitchen and meanwhile continue serving other tables. The preparation of the food and the serving of tables happen simultaneously.

Let's translate this scenario into a simplified sequence diagram:

![Synchronous calls diagram](/src/assets/sync-diagram.png)

➡️ This is what the scenario would look like in synchronous calls.

![Asynchronous calls diagram](/src/assets/async-diagram.png)

➡️ This is what the scenario would look like in asynchronous calls.

But enough about restaurants now - back to code.

Similar scenarios can happen in programming actually, like a call to an external service, a long operation in the database, an own operation that takes a long time processing, and so on. And in these cases, just like at a restaurant, the application should not just sit and wait, it should be non-blocking. It should "place the order", continue with other tasks, and then "come back" when the result is ready.

But how does an application know an operation might take long and how does it go back to the point where it took a break?

There are three techniques you can use to solve this problem, let's have a look here below.
`,

  "cf15-a": `This is the original solution in JavaScript for asynchronous operations. Although an old way to solve the problem, it is still very much used, especially if you are working with legacy code.
In this implementation, you give a function to be called back when the operation is complete.

> 👉 Example:
>
> \`\`\`jsx
> function placeOrderAndPrepareFood(orderItem, callback) {
>   console.log(\`2 - Kitchen: Started preparing \${orderItem}...\`);
>
>   // Simulate the kitchen taking 5 seconds to cook
>   setTimeout(() => {
>     callback(\`\${orderItem}\`);
>   }, 5000);
> }
>
> function serveTable(dish) {
>   console.log(\`4 - Waiter: Delivering \${dish} to the guests!\`);
> }
>
> console.log("1 - Waiter: Taking order for Table A...");
> placeOrderAndPrepareFood("Pizza", serveTable);
>
> console.log("3 - Waiter: Immediately moving on to take Table B's order!");
> \`\`\`

You can notice that in this case you give the function the responsibility of what to do afterwards, so the asynchronous function controls the flow of the program.
Callbacks work well in case of one single call. But what if you have to wait for the response of more calls? To go back to our restaurant example, imagine that the waiter has to wait for the drinks, then the meals, then the dessert, and each one depends on the the one before? Your code starts to look like a messy pile of nested brackets. To solve this 'Callback Hell,' Promises were invented.
`,

  "cf15-b": `📝Exercise: At the restaurant (with Callbacks)
In a restaurant you usually order a drink, a main dish, and maybe a dessert. The waiter should not wait for all the courses to be ready before moving to another table. The following code tracks such order in a synchronous way:

\`\`\`jsx
function prepareFood(orderItem, timeMs) {
  console.log(\`Kitchen: Started preparing \${orderItem}...\`);
  const startTime = Date.now();
  while (Date.now() - startTime < timeMs) { /* Freezes CPU */ }
  console.log(\`Kitchen: \${orderItem} is ready!\`);
}

console.log("Waiter: Taking order for Table A...");

prepareFood("Drink", 5000);
prepareFood("Pizza", 10000);
prepareFood("Dessert", 5000);

console.log("Waiter: All courses served to Table A!");

console.log("Waiter: Immediately moving on to take Table B's order!");
\`\`\`

It prints the following:

* Waiter: Taking order for table A...
* Kitchen: Started preparing a drink...
* Kitchen: Drink is ready!
* Kitchen: Started preparing a pizza...
* Kitchen: Pizza is ready!
* Kitchen: Started preparing dessert...
* Kitchen: Dessert is ready!
* Waiter: All courses served to table A!
* Waiter: Immediately moving on to take table B's order!

Your task: change the code minimaly only using callbacks, to make it asynchronous. It should print the following:

* Waiter: Taking order for table A...
* Kitchen: Started preparing a drink...
* Waiter: Immediately moving on to take table B's order!
* Kitchen: Drink is ready!
* Kitchen: Started preparing pizza...
* Kitchen: Pizza is ready!
* Kitchen: Started preparing dessert...
* Kitchen: Dessert is ready!
* Waiter: All courses served to table A!
`,

  "cf15-c": `With Promises you are responsible for what to do after the asynchronous execution is finished, so you control the flow of the program. The asynchronous function only handles the execution of the task and gives updates of its status.
In the waiter example, he would get a buzzer from the kitchen instead of trusting that the kitchen would call the right waiter at the right time and only once.

> 👉 Example:
>
> \`\`\`jsx
> function placeOrderAndPrepareFood(orderItem) {
>   console.log(\`2 - Kitchen: Started preparing \${orderItem}...\`);
>
>   return new Promise((resolve) => {
>     // Simulate the kitchen taking 5 seconds to cook
>     setTimeout(() => {
>       resolve(\`\${orderItem}\`); // 'resolve' is like triggering the buzzer
>     }, 5000);
>   });
> }
>
> function serveTable(dish) {
>   console.log(\`4 - Waiter: Delivering \${dish} to the guests!\`);
> }
>
> console.log("1 - Waiter: Taking order for Table A...");
>
> placeOrderAndPrepareFood("Pizza")
>   .then(serveTable);
>
> console.log("3 - Waiter: Immediately moving on to take Table B's order!");
> \`\`\`

So the object Promise is returned from the function and in the "then" function of it you can define what to do afterwards. You can have as many tasks as you want, like a chain of "then"(s).

\`\`\`jsx
placeOrderAndPrepareFood("Pizza")
  .then(serveTable)
  .then(takeNextOrder)
  .then(goToNextTable);
\`\`\`

But when should you use Callbacks and Promises?
Think of the following best practices:

* Use Callbacks for simple, immediate actions -> like reacting to a button click

\`\`\`jsx
button.addEventListener('click', () => { console.log("Clicked!"); });
\`\`\`

* Use Promises for asynchronous sequences: Anytime you are fetching data from a server, reading files, or chaining multiple background tasks together.

\`\`\`jsx
downloadFileFromServer("photo.jpg").then((file) => { console.log("Downloaded " + file); });
\`\`\`
`,

  "cf15-d": `📝Exercise: At the restaurant (with Promises)
Change the previous code you wrote with Callbacks to use Promises.
It should print the exact same messages.
`,

  "cf15-e": `What if there is a way to write an asynchronous function very similar to a synchronous one? Or even simpler?
You just need two new keywords:

* async: use it before a function, to define that the function will be handling tasks in the background, out of the main timeline of the program.
* await: use it inside the function where the actual asynchronous task (like a heavy call to an external service) is executed. It makes a pause and waits for the code execution.

> 👉 Example:
>
> \`\`\`jsx
> async function placeOrderAndPrepareFood(orderItem) {
>   console.log(\`2 - Kitchen: Started preparing \${orderItem}...\`);
>
>   await new Promise((resolve) => setTimeout(resolve, 5000));
>
>   serveTable(orderItem);
> }
>
> function serveTable(dish) {
>   console.log(\`4 - Waiter: Delivering \${dish} to the guests!\`);
> }
>
> console.log("1 - Waiter: Taking order for Table A...");
>
> placeOrderAndPrepareFood("Pizza");
>
> console.log("3 - Waiter: Immediately moving on to take Table B's order!");
> \`\`\`

💡 Deep Dive: In summary, a synchronous long task pauses the code execution flow and "freezes" the browser, in case of JavaScript, making it completely unresponsive. On the other hand, an asynchronous task delegates work so the main execution flow is never paused. How could you check and prove that?
`,

  "cf15-f": `📝Exercise: At the restaurant (with Async and Await)
Change the previous code you wrote with Promises to use async and await. It should print the exact same messages.
`,

  "cf16-a": `You have been using APIs even without knowing it!
API (Application Programming Interface) is a sort of communication contract between two pieces of software. It says how to use or call another piece of software, in a library, in a remote server over the internet, or in your own code. For example a class provides an API, which is formed by its public functions, like the Map with its functions set, get, delete, size, and so on.
This could be the Map API:

\`\`\`
new Map<K, V>() -> Map<K, V>
Map.prototype.set(key: K, value: V) -> this
Map.prototype.get(key: K) -> V | undefined
Map.prototype.has(key: K) -> boolean
Map.prototype.delete(key: K) -> boolean
Map.prototype.size -> number
Map.prototype.clear() -> void
\`\`\`

Based on the API, a developer knows how to use or call a service. It means he/she knows where to call (the function or endpoint), what to give (the parameters) and what to expect (return value or behavior).
Throughout the course we have been talking about calling or requesting something from an external service over the internet, but we did not go into detail of how to do that. Here the API comes into play again!
In order to call a service on a remote server, the service also has to provide an API. Usually it is the endpoint with query parameters, for a simple web service.

> 👉 For example: to get weather forecast you could use the open service open-meteo:
>
> \`\`\`jsx
> GET https://api.open-meteo.com/v1/forecast(queryParameters: ForecastParams) -> Promise<ForecastResponse>
>
> where:
>
> ForecastParams = {
>   latitude: number,
>   longitude: number,
>   current: string // Comma-separated list of variables (e.g., "temperature_2m,wind_speed_10m")
> }
>
> ForecastResponse = {
>   latitude: number,
>   longitude: number,
>   generationtime_ms: number,
>   utc_offset_seconds: number,
>   timezone: string,
>   timezone_abbreviation: string,
>   elevation: number,
>   current_units: {
>     time: string,
>     interval: string,
>     temperature_2m: string,
>     wind_speed_10m: string
>   },
>   current: {
>     time: string,
>     interval: number,
>     temperature_2m: number,
>     wind_speed_10m: number
>   }
> }
> \`\`\`
>
> Based on the official API: https://open-meteo.com/en/docs

> 👉 Example:
>
> \`\`\`jsx
> async function getWeatherForecast(place, latitude, longitude) {
>   console.log("Connecting to the Global Weather API...");
>
>   const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current=temperature_2m,wind_speed_10m\`;
>
>   const response = await fetch(url);
>
>   if (!response.ok) {
>     console.log(\`Weather Error! Status: \${response.status}\`);
>     return;
>   }
>
>   const data = await response.json();
>
>   console.log(\`Weather forecast at \${place}\`);
>   console.log(\`Location Time Zone: \${data.timezone}\`);
>   console.log(\`Current Temperature: \${data.current.temperature_2m}°C\`);
>   console.log(\`Wind Speed: \${data.current.wind_speed_10m} km/h\`);
> }
>
> getWeatherForecast("Nairobi, Kenya", -1.2921, 36.8219);
> \`\`\`

***** If you get an error executing this example in the console, try the following:
Open a new tab in the browser.
In the URL bar, type: about:blank and hit Enter.
(Open the console).
Paste and run the code here

The API should describe the possible parameters with its values, and also the response with its attributes. In this way, a developer knows how to handle the input and output.
A few points to highlight from this example:

* fetch: this is the native standard built-in library in JavaScript to make calls over the internet. It returns a Promise, the one you saw in the asynchronous execution section. Why? Because it might handle a heavy task, it is already designed to be executed asynchronously. So you can use the techniques you just learned with Promises or async/await!
* JSON: is a standard data format used to transfer data between services over the internet. It is a plain text string formatted as key-value pairs. While it looks very similar to a JavaScript Object, do not confuse the two: JSON is text, not code. In our example, the raw response we receive from Open-Meteo is a JSON string.

☝️ JSON stands for JavaScript Object Notation. Although it has JavaScript in its name, it is widely used with many other programming languages like Java, Python, C++. As a "universal language", it allows different services from different types and implementations to communicate to each other, like a JavaScript program can communicate with a Python program over the internet.
`,

  "cf16-b": `In computer science, whenever a solution is widely used, or a common problem is discovered, a design pattern or so-called protocol is introduced. This is to ensure a standard procedure across the industry.
This was done as well for the communication over the internet for example.
Imagine, if everybody implemented their APIs without following any standard, it would become a mess. Over the years many patterns, protocols, architecture, etc, were introduced to solve this. Nowadays the great majority uses REST.
REST (Representational State Transfer) API or RESTful is an architectural style for designing web APIs, based on a set of rules, to ensure different systems on the internet can talk to each other predictably.

☝️ An API is called RESTful when:

* Everything is a "Resource": Data is treated similarly to folders or objects. URLs must use Nouns to represent these data collections. For example:
   * /v1/forecast
   * /v1/users
* It uses Standard HTTP Methods: It provides CRUD (Create, Read, Update, Delete) operations which are mapped with HTTP Methods (Verbs). For example:
   * GET /v1/users/123
   * POST /v1/users
   * PUT /v1/users/123
   * DELETE /v1/users/123

☝️ REST is mostly used, but there are other API architectural styles like GraphQL, WebSockets, gRPC, etc. As we cover only the basics in this section, we focus on REST.
`,

  "cf16-c": `📝Exercise: Weather forecast at home
Use an open online service, like ip-api.com/json, to retrieve your current position (latitude and longitude) and feed the open-meteo to get the weather forecast at your current position. Besides that, it should print an additional attribute "Accurate": if the weather data record is older than 60 minutes, it should print false, otherwise true.
Hint: read the official open-meteo API to learn how to get the weather data record date/time.
`,

  "cf4-a": `In coding, values don't just sit there. You can combine them, compare them, or change them. By values we mean some sort of information (numbers, text, list, etc.) usually used in a calculation, in a function or stored in a variable.
The symbols used to perform these actions on values are called operators.
Operators in JavaScript let you:

* assign a value (=, +=, -=, *=, /), %=, **=)
   * The result is assigned to a variable.
* compare values (>, <, >=, <=, ==, !=, ===, !==)
   * The result is either true or false.
* perform arithmetic (+, -, *, /, %, **)
   * The result is another value of the same data type.
* work with logic (&&, ||, !)
   * The result is either true or false and is used to make a decision based on a condition.
   * These operators are called:
      * &&: AND
      * ||: OR
      * !: NOT (negation)

It's important to note, that the operator + can be used with strings as well as numeric data types. When used with strings, the strings become concatenated, meaning they are connected. For example, "Hello" + " World!" would result in "Hello World!". You can also concatenate strings and numbers, which are then converted into strings. For example, "Hello" + " World! " + 2025 would result in "Hello World! 2025".

> 👉 Example:

\`\`\`jsx
const isActive = true; // Assignment operator
let a = 5 + 3;    // Arithmetic operator -> a equals 8
let b = (a > 5);  // Comparison operator -> b equals true
let age = a * 2 - 1; // Mixed operators -> age equals 15
let isAdult = age >= 18 && isActive; // Logical operator -> isAdult equals false
\`\`\`

💡Deep Dive: When using the && (AND) operator if the first condition is false, does JavaScript continue checking the second condition? What about when using &? Why is this behaviour important?
`,

  "cf4-b": `👀 Optional video resource

Watch this video for a deeper understanding of operators:

[JavaScript Operators – Tutorial (YouTube)](https://www.youtube.com/watch?v=yEJ94pMiT-o&pp=ygULanMgb3BlcmF0b3I%3D)
`,

  "cf4-c": `📝Exercise: Find the right result for each operator
Fill the result of each operation by replacing the placeholder (i.e. RESULT_ADD) with the correct value. When executing each line of code, it should print true as a result, otherwise your answer is wrong.

\`\`\`jsx
console.log(4 + 3 === RESULT_ADD); // For example, here replace RESULT_ADD with 7
console.log(10 - 6 === RESULT_SUB);
console.log(2 * 5 === RESULT_MULT);
console.log(9 / 3 === RESULT_DIV);
console.log(7 % 3 === RESULT_REST);
console.log(5 > 2 === RESULT_GT);
console.log(10 === "10" === RESULT_EQ_STRICT);
console.log(8 !== 8 === RESULT_NEQ_STRICT);
console.log(true && false === RESULT_LOG_AND);
console.log(true || false === RESULT_LOG_OR);
console.log(!false === RESULT_LOG_NOT);
\`\`\`
`,

  "cf4-d": `📝Exercise: Find the operator for the given result
Fill the operator by replacing the placeholder OPERATOR with the correct operator to give the expected result. When executing each line of code, it should print true as a result, otherwise your answer is wrong.

\`\`\`jsx
console.log(6 OPERATOR 4 === 10); // For example, here replace OPERATOR with +
console.log(5 OPERATOR 5 === 25);
console.log(24 OPERATOR 8 === 3);
console.log(12 OPERATOR "12" === true);
console.log(9 OPERATOR 4 === true);
console.log(!false OPERATOR !false === true);
\`\`\`
`,

  "cf3-a": `Earlier, we learned about variables by writing them in pseudocode. But we don't know yet how to create variables in JavaScript, using its correct syntax. So, let's have a look.
In JavaScript we can create variables using the following syntaxes:

* **var**: Introduced in older versions of JavaScript, var can be global or function-scoped. When function-scoped, it can be accessed from the entire function where it is declared, not respecting any inner blocks.
* **let** and **const**: Introduced in ES6 (ECMAScript 2015)* - a newer version of JavaScript that added modern features and cleaner syntax. Both are block-scoped, meaning they are only accessible within the {} block where they are defined (like inside an if statement or for loop).
   * Use const for values that should not change, and let for values that can change.
   * Use const by default, and only use let when the value needs to change.

☝️ Avoid using var in modern JavaScript, as it can cause confusing bugs.

> 👉 Examples of let, const, and var:

\`\`\`jsx
let name = "Alice";       //block-scoped, can be reassigned
const PI = 3.14159;       //block-scoped, constant
var count = 0;            //function-scoped variable
\`\`\`
`,

  "cf3-b": `👀 Optional video resource

Another important thing to know is that each variable must correspond to a so-called data type. There are 7 primitive data types in JavaScript - watch the video linked below to learn about them. Later on you will learn about more complex data types.

[JavaScript Data Types for Beginners (freeCodeCamp)](https://www.youtube.com/watch?v=808eYu9B9Yw&pp=ygUPZGF0YXR5cGVzIGluIGpz)
`,

  "cf3-c": `📝Exercise: Declaration and assignments of variables
Declare a let variable and a const variable. Try reassigning both and observe the results (e.g. console.log after assignment).
`,

  "cf3-d": `📝Exercise: Testing data types
Create variables of different types (like in the video above) and log the type of each variable to the console.
`,

  "cf2-a": `Let's say you want to run our previous pseudocode with the rice recipe on a webpage. Unfortunately, this wouldn't work because an algorithm is just a generic set of instructions, not written for any specific programming language.
So what we're looking for, if we want to run our recipe on a webpage, is a *program*. A program has code that is syntactically valid according to the rules of a specific programming language. So the recipe would have to be written using the syntax of the chosen language, like JavaScript, to become a usable program.

> 👉***JavaScript is an interpreted programming language used to code the interactivity on web pages or web applications as a Frontend development.***

What exactly does that mean? Here are a few concepts that will help you understand this better.

**Execution type → how does the program run?**

| **Execution Type** | **How it works** | **Examples** |
| --- | --- | --- |
| **Compiled** | Entire code is translated to machine code (bits) before running. | C, C++, Rust, Go |
| **Interpreted** | Code is read and executed (interpreted) line by line, not compiled/translated before. | **JavaScript**, Python, Ruby |
| **Hybrid** | Code is first compiled to bytecode, then interpreted or JIT(just-in-time)-compiled at runtime | Java, C#, Kotlin |

So JavaScript as an interpreted language, there is no need for compilation, it can be "interpreted" or read by an Interpreter program.

**Frontend vs Backend → where does the program run?**

| **Part** | **Runs on** | **Used for** | **Examples** |
| --- | --- | --- | --- |
| **Frontend** | User's browser or device | What the user sees and interacts with | HTML, CSS, **JavaScript** |
| **Backend** | Server (remote machine) | Logic, data, storage, authentication | Java, Python, C#, PHP, Node.js, Go |

An example of an Interpreter program is a web browser, where you navigate on the internet. That´s the Frontend side, where JavaScript runs. So whenever a program in JavaScript needs some heavy logic or access to a resource in the backend, like a database, it might make a call to another program running on the Backend side. These two development parts together can represent a Client-Server Architecture.

**Client-Server Architecture**

- **Client-side (Frontend): Controls what you see in the browser and handles user´s interactivity. Also requests services and data from the Server-side.**
- **Server-side (Backend): Responds to requests from Client-side by also accessing other services or resources, like databases.**

Now we know how and where JavaScript is used. What we're missing is to know when **to use it.
You can imagine JavaScript as being the "muscle and brain" of a web page or web application. It can be applied to use cases such as:

- User-interactive web pages (i.e. validation of form inputs before submission, reaction to user actions)
- Dynamic creation of HTML (what you see of the web page), like creating or showing an HTML element (for example a text box or an image) based on some condition
- Features of web pages, such as: animation, pop-ups, menus, etc
- Games

**Basic commands and concepts**

Next, let's learn some very basic commands and concepts in JavaScript, so that we can start putting our knowledge into practice later:
In order to learn these first commands we will work in a component called "console" which is available in all mainstream web browsers. Here we can execute simple lines of JavaScript code to start practicing.
Usually when learning a new programming language, the so-called "Hello World!" program is the first one written. So, let´s start with that!
To print (write) something in a browser´s console, you can use the following command:

\`\`\`jsx
console.log("Your text to be printed");
\`\`\`

This command contains two main parts: object and function. In this case *console* is an object provided by JavaScript to interact with the browser's console. And *log* is one of the multiple functions present in this object, being used to print something in the console. A function is like a command or block of commands to perform a small task, as in our rice recipe. Note: A string (text) is **always** represented within quotation marks ("").
As we know, JavaScript cannot function on its own in a web browser. It needs to be embedded in a web page, written in a *markup language* called **HTML**. We will learn all about HTML in the next chapter. For now, it is just important for you to know that JavaScript can "live" inside the so-called "tag script" in HTML.

> 👇For example: You can find the tag script marked in yellow in this below example

\`\`\`html
<script>
  here comes JavaScript code
</script>
\`\`\`

**How to access the console in your browser**

Here you can find the shortcuts you need to open the console view depending on what operating system and web browser you use::

| **Browser** | **Windows / Linux** | **macOS** | **Menu Path** |
| --- | --- | --- | --- |
| **Google Chrome** | Ctrl + Shift + J | ⌘ + Option + J | Menu → More Tools → Developer Tools → Console tab |
| **Mozilla Firefox** | Ctrl + Shift + K | ⌘ + Option + K | Menu → Web Developer → Web Console |
| **Microsoft Edge** | Ctrl + Shift + J | ⌘ + Option + J | Menu → More Tools → Developer Tools → Console tab |
| **Safari (must enable first)** | — | ⌘ + Option + C | Develop → Show JavaScript Console |
| **Opera** | Ctrl + Shift + I (then select Console tab) | ⌘ + Option + I (then select Console tab) | Menu → Developer → Developer Tools |

![Example of what the console can look like in Chrome on macOS.](/src/assets/console.png)

*Example of what the console can look like in Chrome on macOS.*
`,

  "cf2-b": `📝Exercise: Hello, World! in the console.
Print the text "Hello World!" in the browser's console.
`,

  "cf2-c": `📝Exercise: Hello, World! in the web browser.
Adapt the HTML code above so that it also prints the text "Hello World!" in the console and save it in a file with the name helloworld.html. When you open the file using a browser, it should print the text in the console. Pay attention that in this case you are not pasting the JavaScript code directly in the console.
`,

};
