import { useState } from "react";
import { useBorrowRequests } from "../hooks/useBorrowRequests";
import BorrowRequestCard from "../components/BorrowRequestCard/BorrowRequestCard";

function BorrowRequests() {
  const { requests, status, error } = useBorrowRequests();
  const [search, setSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("all");
  const statuses = [
    ...new Set(requests.map((request) => request.status).filter(Boolean)),
  ];
  const query = search.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      requestStatus === "all" || request.status === requestStatus;
    const matchesSearch =
      !query ||
      [request.id, request.bookId, request.userId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return (
    <main>
      <h1>Borrow Requests</h1>

      <label htmlFor="request-search">Search requests</label>
      <input
        id="request-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Request, book, or member ID"
      />
      <label htmlFor="request-status">Status</label>
      <select
        id="request-status"
        value={requestStatus}
        onChange={(event) => setRequestStatus(event.target.value)}
      >
        <option value="all">All statuses</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {status === "idle" && (
        <p role="status">Waiting to load borrow requests...</p>
      )}
      {status === "loading" && (
        <p role="status">Loading borrow requests...</p>
      )}
      {status === "failed" && (
        <p role="alert">
          {error?.message || "Something went wrong while loading borrow requests."}
        </p>
      )}

      {status === "succeeded" && requests.length === 0 && (
        <p>No borrow requests found.</p>
      )}

      {status === "succeeded" && requests.length > 0 && filteredRequests.length === 0 && (
        <p>No borrow requests match these filters.</p>
      )}

      {status === "succeeded" && filteredRequests.length > 0 && (
        <div>
          {filteredRequests.map((request) => (
            <BorrowRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </main>
  );
}

export default BorrowRequests;
