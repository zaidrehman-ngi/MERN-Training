import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/">Return to home</Link>
    </main>
  );
}

export default NotFound;
