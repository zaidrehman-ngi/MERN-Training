import { useState } from "react";
import { useBorrowRequests } from "../hooks/useBorrowRequests";
import useDebounce from "../hooks/useDebounce";
import BorrowRequestCard from "../components/BorrowRequestCard/BorrowRequestCard";
import Pagination from "../components/Pagination";
import { BORROW_REQUEST_STATUSES } from "../constants/borrowRequests";

function BorrowRequests() {
  const [search, setSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const {
    items: requests,
    total,
    pageCount,
    status,
    error,
  } = useBorrowRequests({
    page,
    search: debouncedSearch,
    status: requestStatus,
  });
  const filtered = debouncedSearch.trim() !== "" || requestStatus !== "all";

  return (
    <main>
      <h1>Borrow Requests</h1>

      <label htmlFor="request-search">Search requests</label>
      <input
        id="request-search"
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Book title or member name"
      />
      <label htmlFor="request-status">Status</label>
      <select
        id="request-status"
        value={requestStatus}
        onChange={(event) => {
          setRequestStatus(event.target.value);
          setPage(1);
        }}
      >
        <option value="all">All statuses</option>
        {BORROW_REQUEST_STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {status === "idle" && (
        <p role="status">Waiting to load borrow requests...</p>
      )}
      {status === "loading" && <p role="status">Loading borrow requests...</p>}
      {status === "failed" && (
        <p role="alert">
          {error?.message ||
            "Something went wrong while loading borrow requests."}
        </p>
      )}

      {status === "succeeded" && requests.length === 0 && (
        <p>
          {filtered
            ? "No borrow requests match these filters."
            : "No borrow requests found."}
        </p>
      )}

      {status === "succeeded" && requests.length > 0 && (
        <>
          <p>
            Showing {requests.length} of {total} requests
          </p>
          <div>
            {requests.map((request) => (
              <BorrowRequestCard key={request.id} request={request} />
            ))}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}

export default BorrowRequests;
