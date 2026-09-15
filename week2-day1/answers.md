# Exercise 1

## Task 1 — Scaffold the Project

`index.html` is the main HTML file loaded by the browser. It contains the root `<div>` where React mounts the application.

`src/main.jsx` is the entry point that connects React to the root element and renders the application.

`src/App.jsx` contains the main React component and the application's UI.

`vite.config.js` contains the configuration and settings for Vite.

### Where React Takes Over the Page

```js
createRoot(document.getElementById('root')).render(
```


## Task 2 — Break It on Purpose

I changed the root div's id from `root` to `app` and got the error `Target container is not a DOM element.` This happened because `main.jsx` was still looking for the `root` element.

This shows that React mounts inside a specific HTML element and only controls the content inside that root element, not the entire page.


## Task 3 — Vite vs Create React App

Create React App is deprecated. Its terminal output also showed several deprecated packages and dependency warnings.

Vite started the development server in about 277 ms, while Create React App took about 12 seconds.

The Vite project has 7 top-level files and 3 folders. The CRA project has 4 top-level files and 3 folders.

Vite has its build configuration in `vite.config.js` at the project root. CRA does not expose its build configuration in the project root; it is managed internally by `react-scripts`.


## Task 4 — HMR and Input State

The text I typed into the input stayed after I changed the heading and saved the file. Vite's Hot Module Replacement (HMR) updated the changed code without doing a full page reload, so the existing input was preserved.


## Task 5 — Declarative React and the Virtual DOM

With React, I no longer have to manually create elements, add them to the page, or find them again to update them. I describe what the UI should look like, and React handles the DOM updates for me.

The Virtual DOM is a lightweight representation of the UI that React uses to compare the previous and new versions of the UI. React then updates only the necessary parts of the actual DOM instead of rebuilding everything manually.


# Exercise 2

## Task 1 — Initial Errors

When I pasted the HTML into `BookCard.jsx` without making any changes, Vite failed to build and showed these errors:

```text
[PARSE_ERROR] Expected corresponding JSX closing tag for 'input'.

[PARSE_ERROR] Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
```

The browser console also showed:

```text
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```


## Task 2 — JSX Rules

`<img>` and `<input>` must be self-closed in JSX. This is because JSX requires elements without closing tags to use the self-closing syntax.

HTML `class` becomes `className` in JSX because `class` is a reserved JavaScript keyword.

The `style` prop takes a JavaScript object instead of a CSS string, and CSS property names such as `background-color` become camelCase like `backgroundColor`.

The HTML `for` attribute becomes `htmlFor` in JSX.

HTML attributes such as `maxlength` use camelCase in JSX, so it becomes `maxLength`.

Event handlers use camelCase in JSX, so `onclick` becomes `onClick`.

An `onClick` handler must receive a function rather than a string of JavaScript code.

The `data-book-id` attribute is valid exactly as written because JSX allows custom `data-*` attributes.


## Task 4 — Empty List and Conditional Rendering

When `books` is an empty array, `books.length` is `0`. The expression:

```jsx
{books.length && <BookList books={books} />}
```

becomes:

```jsx
{0 && <BookList books={books} />}
```

Since `0` is falsy, the `&&` expression returns `0`. React renders `0` as visible content, which is why `0` appeared on the page. This connects to Task 3, where we saw that React renders `0`, while values such as `false`, `null`, and `undefined` are not rendered.

### Fix 1

```jsx
{books.length > 0 && <BookList books={books} />}
```

This explicitly checks whether the array contains at least one book. When the array is empty, the condition evaluates to `false`, which React does not render.

### Fix 2

```jsx
{books.length ? <BookList books={books} /> : null}
```

This uses a ternary operator. When the array is empty, it returns `null`, which React does not render.


## Task 5 — Braces

**When do you need `{}` around an attribute value and when do quotes?**
Use quotes for a fixed string value, such as `className="book-card"`. Use `{}` when the attribute value comes from a JavaScript expression, such as `className={className}` or `id={book.id}`.

**Why does `style` take an object rather than a string, and what happens to the property names?**
The JSX `style` prop takes a JavaScript object so React can work with each CSS property as a value. CSS property names change from kebab-case to camelCase, such as `background-color` becoming `backgroundColor`.

**Why can you put a ternary inside braces but not an `if` statement?**
A ternary is an expression because it produces a value, so it can be used inside JSX braces. An `if` statement is a statement and does not directly produce a value, so it cannot be placed inside JSX braces.


# Exercise 3

## Task 1 — JSX Transformation

My handwritten `React.createElement()` equivalent was:

```js
React.createElement(
  "section",
  { className: "shelf" },
  React.createElement(
    "h2",
    null,
    "New arrivals"
  ),
  React.createElement(
    BookCard,
    { title: "Dune", copies: 3 }
  )
)
```

The Babel compiler produced the following modern JSX transform:

```js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

_jsxs("section", {
  className: "shelf",
  children: [
    _jsx("h2", {
      children: "New arrivals"
    }),
    _jsx(BookCard, {
      title: "Dune",
      copies: 3
    })
  ]
});
```

The main difference is that Babel used `_jsx` and `_jsxs` from `react/jsx-runtime` instead of `React.createElement()`. It also represents children using a `children` property. `_jsxs` was used for `section` because it has multiple children, while `_jsx` was used for `h2` and `BookCard`.


## Task 2 — Component Naming

Lowercase JSX names such as `section` and `h2` are treated as HTML elements, so the compiler converts them to strings. Capitalized names such as `BookCard` are treated as JavaScript component references, so they remain bare identifiers.

When I renamed the component to `bookCard` and used `<bookCard />`, React treated it as a browser/HTML tag instead of a component. Nothing rendered on the screen, and the console showed warnings that `<bookCard>` was an unrecognized tag and should use PascalCase for React components.


## Task 3 — JSX from `React.createElement()`

The `React.createElement()` code converted back to JSX is:

```jsx
<ul className="fines">
  <li>Dune — Rs 60</li>
  <li style={{ color: 'crimson' }}>Hyperion — Rs 100</li>
</ul>
```

I ran both the `React.createElement()` version and the JSX version in the Vite project. Both produced the same DOM:

```html
<ul class="fines">
  <li>Dune — Rs 60</li>
  <li style="color: crimson;">Hyperion — Rs 100</li>
</ul>
```

Therefore, both forms produce the same DOM.


## Task 4 — JavaScript Behind JSX

**Why must a component return a single root element?**
`React.createElement()` returns a single value, so a component's return value must also be a single element/value. Multiple sibling elements need to be wrapped in a parent element or fragment.

**Why can a ternary go inside braces but not an `if` statement?**
JSX braces expect a JavaScript expression that produces a value. A ternary is an expression, while `if` is a statement, so `if` cannot be used directly inside braces.

**Why is the attribute `className` instead of `class`?**
JSX attributes become JavaScript object properties, and `class` is a reserved JavaScript keyword. Therefore, `className` is used instead.


## Task 5 — Who Transforms JSX?

In my Vite project, Babel is not configured or imported. The project uses Vite 8.2.2 with `@vitejs/plugin-react` 6.1.0, and Vite 8 uses Oxc for JavaScript and JSX transformation.

The transformation happens during Vite's development/build process, before the code reaches the browser. The browser receives regular JavaScript with the JSX already transformed into JavaScript calls such as `_jsx` and `_jsxs`; there is no JSX at runtime.


# Exercise 4

## Task 1 — Grid and Fragments

The extra wrapper `<div>` made the `BookCard` elements nested instead of being direct children of the grid. After removing the wrappers, the Elements panel confirmed that all three `BookCard` elements are direct children of `.book-grid` with no extra elements.


## Task 2 — Fragments

Fragments can be written using the short syntax `<>...</>` or the long syntax `<React.Fragment>...</React.Fragment>`.

The short syntax cannot accept props such as `key`. When a `key` is required, the long syntax must be used:

```jsx
<React.Fragment key={book.id}>
  <h3>{book.title}</h3>
  <p>{book.author}</p>
</React.Fragment>
```


## Task 3 — The `children` Prop

The `children` prop changes depending on what is passed between the component's tags:

* **Two children:** `Array` of React elements
* **One child:** A single React element object
* **No children:** `undefined`

This shows that `children` does not always have the same type, so code that assumes it is always an array can cause bugs.


## Task 4 — Passing Different Types Through JSX

I passed four different types of values into `BookCard`:

* A string: `title="Dune"`
* A number from a variable: `copies={copies}`
* An object: `book={dune}`
* A function: `onBorrow={handleBorrow}`

The `onBorrow` function was connected to the Borrow button. Clicking the button logged the book ID:

```text
Book clicked: bk-4471
```


## Task 5 — Function Call vs Function Expression

In the first line, the braces contain `onBorrow(book.id)`, which is a function call. So the function runs immediately when the component loads, before clicking the button.

In the second line, the braces contain an arrow function `() => onBorrow(book.id)`. The function is not called immediately. It runs only when the button is clicked.

So, what we put inside the braces makes the difference: the first one calls the function immediately, while the second one gives `onClick` a function to run later.
