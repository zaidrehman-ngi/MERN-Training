import { useBorrowRequests } from "../hooks/useBorrowRequests";
import BorrowRequestCard from "../components/BorrowRequestCard/BorrowRequestCard";

function BorrowRequests() {
  const { requests, loading, error } = useBorrowRequests();

  return (
    <main>
      <h1>Borrow Requests</h1>

      {loading && <p>Loading borrow requests...</p>}

      {!loading && error && (
        <p>Something went wrong while loading borrow requests.</p>
      )}

      {!loading && !error && requests.length === 0 && (
        <p>No borrow requests found.</p>
      )}

      {!loading && !error && requests.length > 0 && (
        <div>
          {requests.map((request) => (
            <BorrowRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </main>
  );
}

export default BorrowRequests;
