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
