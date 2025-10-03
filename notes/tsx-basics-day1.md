# TSX Basics Cheat Sheet

> TSX = TypeScript + JSX (JavaScript XML)

---

## 1. Components
- A component = a function that **starts with a capital letter** and returns JSX.
```tsx
function Greeting() {
  return <h1>Hello!</h1>;
}
Usage:
<Greeting />

## 2. Props (like function arguments)
- Props = data passed into a component

type GreetingProps = { name: string };

function Greeting({ name }: GreetingProps) {
  return <p>Hello {name}</p>;
}

// usage
<Greeting name="Rain" />

? makes a prop optional
type Props = { username: string; isAdmin?: boolean };


## 3. Expressions with {}
- Use {} to run JS inside JSX
<p>2 + 2 = {2 + 2}</p>   // → 4
<p>{loggedIn ? "Welcome" : "Please log in"}</p>

## 4. classNames
- Use className instead of class (since class is a reserved word in JS)
<div className="bg-blue-500 text-white p-2">Hello</div>

## 5. Fragments
- Group multiple elements without an extra <div>
<>
  <h1>Title</h1>
  <p>Body</p>
</>

## 6. Loops
const items = ["A", "B", "C"];

<ul>
  {items.map((item, i) => (
    <li key={i}>{item}</li>
  ))}
</ul>

## 7. Event Handlers
<button onClick={() => alert("Clicked!")}>Click me</button>

## 8. State (for dynamic values)
- "use client" must be at the top if you use state/events

"use client";
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  );
}

## 9. Conditional rendering
{isAdmin && <span>(Admin)</span>}
{loggedIn ? <p>Welcome</p> : <p>Please sign in</p>}

## 10. Exporting components
- export default -> file's main export (imported without {})
- export -> named export (imported with {})

// default export
export default function Button() { return <button>Hi</button>; }
import Button from "./Button";

// named export
export function Button() { return <button>Hi</button>; }
import { Button } from "./Button";
