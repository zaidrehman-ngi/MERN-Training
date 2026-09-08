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
