# Exercise 1

## Task 1 — Fresh URL vs In-App Navigation

When someone types `library.pk/books` into a fresh tab and presses Enter, the browser sends a request to the server for `/books`. The server sends back the application's HTML and assets, the browser loads them, and the JavaScript runs. React Router then reads the `/books` URL and renders the Books page for that route.

When someone clicks a React Router `Link` to `/users` while the application is already running, the browser does not request and reload the whole application again. React Router handles the navigation, updates the URL to `/users`, and renders the Users page inside the existing application. This is the main difference between loading a URL directly and navigating inside a single-page application.


## Task 2 — React Router Setup

I installed `react-router-dom` version `7.18.4`, so the major version is **7**.


## Task 3 — Link vs Anchor

### Router Link

With the router `Link`, the page did not fully reload and no new document request appeared in the Network tab. However, the search state was empty when I returned to `/books` because the Books component had unmounted and its local state was reset.

`Link` performs client-side navigation through React Router. It changes the URL and renders the new route without requesting a new document from the server.

### Plain Anchor

With `<a href="/users">`, the browser performed a normal navigation and a new document request appeared in the Network tab. I expected the search state to be lost when returning to `/books`, but the `dune` value was restored.

This happened because the browser restored the previous `/books` document from its back-forward cache (bfcache) when I pressed the Back button.

The main difference is that `Link` performs client-side navigation without a full document reload, while a normal anchor performs browser navigation and requests a new document.


## Task 4 — NavLink Navigation

I built a separate `Navbar` component using `NavLink` for Home, Books, Users, and Borrow Requests. `NavLink` provides an `isActive` value that lets the navigation item know whether its route matches the current URL, so the active page can be visibly styled using the design tokens.

`Link` only handles navigation and does not provide the active-state behaviour directly. Using `NavLink` avoids manually tracking the current page and comparing it with the URL.

Keeping the navigation in a separate component also makes it reusable and keeps routing/navigation UI separate from the page components.


## Task 5 — Navigate from Code

I used React Router's `useNavigate` hook to navigate to `/books` after the Add a Book form submits successfully. The navigation happens without a full page reload.

If I used `window.location` instead, the browser would perform a full page reload instead of client-side navigation.


## Task 6 — Deep Links on a Static Host

In development, the dev server can return the React application's `index.html` for routes such as `/books/bk-3`, allowing React Router to handle the URL.

On a static host, the server needs to be configured with an SPA fallback so that requests for unknown paths return `index.html` instead of a 404. React Router can then read the URL and render the correct page.

If the fallback is not configured, opening `/books/bk-3` directly will result in a `404 Not Found` response because the server looks for a file at that path and cannot find one.


# Exercise 2

## Task 2 — useParams and ID Types

`useParams` always returns URL parameters as strings, even when the value looks like a number. Because of this, a numeric ID in the fixture does not match the string returned from the URL when using strict equality.

This will also matter when working with other URL parameters in this application, such as numeric IDs for members, loans, or other records. They will need to be converted to numbers before numeric comparisons or calculations.


## Task 4 — Shared Layout and Nested Routes

I moved the shared Header, Navbar, and Sidebar into an `AppLayout` route and used `Outlet` to render the child routes. The Books route now uses an index route for `/books`, while `/books/bk-3` renders `BookDetail` inside the same layout.

I confirmed in DevTools that the Header does not unmount or remount while navigating between the routes.


## Task 5 — Query String State

I moved the search term and selected filter from component state into the URL query string using React Router's `useSearchParams` hook.

The search term is stored as `q` and the selected filter as `filter`, so a URL such as `/books?filter=overdue&q=dune` reproduces the same screen state.

I tested the URL by opening it in a new tab, using the browser Back button, and refreshing the page. In all three cases, the search term and filter state were preserved correctly.


# Exercise 3

## Task 2 — Inline BookCard

I added dedicated BookCard tokens for the normal and compact cover dimensions, plus a shared border-width token. These values belong in `tokens.css` so the inline-styled component can use the same named design values directly instead of rebuilding dimensions with `calc(...)` or relying on the browser's `thin` border keyword.

I experimentally attempted the remaining behaviors using only React's `style` prop. None could be implemented as requested. A normal inline style object represents the element's current styles; it cannot define the `:hover` or `:focus-visible` pseudo-classes, and it cannot contain an `@media` responsive rule. The hover state, keyboard-only focus ring, and narrow-screen vertical layout therefore remain unimplemented without CSS or JavaScript workarounds.

## Task 3 — CSS Modules BookCard

I created `BookCardModule` and moved the BookCard styling into `BookCardModule.module.css`. CSS Modules scopes each local class to the component, so the build transforms names such as `card` into generated names such as `BookCardModule_card__...`. This prevents class-name collisions and unintended style leakage from a large global stylesheet.

The CSS Module implements card and button hover states, a `:focus-visible` ring on the View Book button, and a media query that stacks the card vertically on a narrow screen. The status badge uses separate module classes mapped from the normalized `available`, `out`, and `overdue` status values, with the neutral token fallback for unknown statuses.

I temporarily rendered `BookCardModule` in `Books.jsx`. Browser testing confirmed the normal card, compact styles, status colours, hover states, keyboard focus ring, and narrow-screen vertical stacking. DevTools showed a generated CSS Module class name on the card, confirming that the local class was transformed and scoped by the build.

## Task 4 — Styled Components BookCard

I created `BookCardStyled` using styled-components and temporarily rendered it from `Books.jsx`. The card and button hover states, button `:focus-visible` ring, compact variant, and narrow-screen stacking are defined in the styled component templates using the existing design tokens.

The status badge colour is driven directly by the normalized `$status` prop inside the styled `Status` component. Its interpolation selects the available, out, overdue, or neutral token without requiring a separate CSS class mapping in the component.

DevTools showed generated styled-components class names such as `sc-bdvwhi cHEJmF` for the card and `sc-jRQBiJ jkleIB` for the available status, rather than CSS Modules names such as `_card_2ak56_1`. The first class identifies the styled component and the second class reflects its generated style variant; the status second class changed for the out and overdue prop values. Styled-components generates these names from component definitions at runtime, while CSS Modules transforms local stylesheet class names. Both approaches keep component styles scoped and avoid global class-name collisions.

The dependency cost was the addition of `styled-components` `^6.5.3` to `package.json` and the corresponding package and transitive dependency entries in `package-lock.json`. Browser testing confirmed the normal card, status colours, hover states, keyboard focus-visible ring, compact dimensions, and narrow-screen vertical stacking.


## Task 5 — Styling Comparison

| Approach          | Scoping          | Props / Dynamic Values           | Pseudo-classes / Media Queries | Browser Output                   | Debugging                                           | Designer Colour Change                  |
| ----------------- | ---------------- | -------------------------------- | ------------------------------ | -------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Inline styles     | Element-level    | Easy                             | Not directly supported         | Inline `style`                   | Easy to see, but mixed with component code          | Less convenient                         |
| CSS Modules       | Component-scoped | Needs class mapping              | Fully supported                | Generated scoped CSS classes     | Easy; styles are in a separate CSS file             | Easy; colour is in CSS                  |
| styled-components | Component-scoped | Easy; props can be used directly | Fully supported                | Generated classes + injected CSS | Can be less obvious because styles are inside React | Less convenient for non-React designers |

All three can produce the same final UI. They mainly differ in how styles are organised and maintained.

All three use the same `tokens.css`, so colours, spacing, and sizes are already shared. This reduces the practical difference between the approaches.


# Exercise 4

## Task 2

I used the **callback prop (`onSelect`)** approach, similar to the `onBorrow` pattern from Week 2. `Books.jsx` handles the routing with `useNavigate` and passes an `onSelect` callback to `BookCardModule`. This keeps `BookCardModule` independent of React Router and reusable in an app without routing.

The other option was using **`children`**, where the parent would provide the navigation element/content. That would also keep the component router-independent, but it would require changing the card structure/API to support and position the provided content.


## Task 4

I am assuming that `/members` will also have a list page, following the same structure as the existing Books and Users pages.

### Files I would create

1. `src/hooks/useMembers.js` — handle loading, error, and member data.
2. `src/components/MemberCard/MemberCard.jsx` — display a member in the list.
3. `src/components/MemberCard/MemberCard.module.css` — style the member card.
4. `src/routes/Members.jsx` — create the members list page.
5. `src/routes/MemberDetail.jsx` — create the member detail page for `/members/:id`.

If the backend/API is not available yet, I would also create `src/data/members.fixture.js` for mock member data. With a real backend, the data would come from the API instead.

### Files I would modify

6. `src/data/mockApi.js` — if we are still using mock data, add the member data loader. With a real backend, this would be replaced by the API/service layer.
7. `src/App.jsx` — add the `/members` and `/members/:id` routes.
8. `src/components/Navbar/Navbar.jsx` — add navigation to the Members page.

The list is long because each resource currently has its own data setup, hook, card, styling, and route files. This structure is clear, but repeating the same setup for every resource makes adding a new route take more work.

To make future routes cheaper, I would make more use of reusable components for common parts such as cards and loading, error, and empty states. I would also reuse common data-fetching patterns where appropriate instead of creating unnecessary resource-specific code each time.