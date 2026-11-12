import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { runDueReminders } from "../api/jobs";

function Home() {
  const { user, can } = useCurrentUser();
  const [jobMessage, setJobMessage] = useState("");

  const handleRunReminders = async () => {
    setJobMessage("Running...");
    try {
      const response = await runDueReminders();
      const { found, sent } = response.data.data;
      setJobMessage(`Done: ${sent} of ${found} loans reminded.`);
    } catch (error) {
      setJobMessage(error.message);
    }
  };

  return (
    <main>
      <h1>
        {user ? `Welcome, ${user.name}` : "Welcome to Karachi Central Library"}
      </h1>
      <div className="homeLinks">
        <Link to="/books">Browse catalogue</Link>
        {user && (
          <Link to="/borrow-requests">
            {can("requests:seeAll") ? "Approval queue" : "My borrow requests"}
          </Link>
        )}
        {can("books:add") && <Link to="/books/add">Add a book</Link>}
        {can("members:list") && (
          <Link to="/users">
            {can("members:manage") ? "Manage members" : "Members"}
          </Link>
        )}
        {!user && <Link to="/login">Log in</Link>}
        {!user && <Link to="/register">Register</Link>}
      </div>

      {can("jobs:run") && (
        <section>
          <h2>Admin tools</h2>
          <button type="button" onClick={handleRunReminders}>
            Send due reminders now
          </button>
          {jobMessage && <p role="status">{jobMessage}</p>}
        </section>
      )}
    </main>
  );
}

export default Home;
