import { Link } from "react-router-dom";

function Home() {
  return (
    <main>
      <h1>Welcome to your library workspace</h1>
      <p>Manage the catalogue, members, and borrow requests from one place.</p>
      <div className="homeLinks">
        <Link to="/books">Browse catalogue</Link>
        <Link to="/books/add">Add a book</Link>
        <Link to="/borrow-requests">View borrow requests</Link>
      </div>
    </main>
  );
}

export default Home;
