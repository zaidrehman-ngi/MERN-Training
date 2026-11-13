import { useEffect, useState } from "react";
import { useBorrowRequests } from "../hooks/useBorrowRequests";
import useDebounce from "../hooks/useDebounce";
import BorrowRequestCard from "../components/BorrowRequestCard/BorrowRequestCard";
import Pagination from "../components/Pagination";
import { BORROW_REQUEST_STATUSES } from "../constants/borrowRequests";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  cancelBorrowRequest,
  changeDueDate,
  decideBorrowRequest,
  returnBorrowRequest,
  waiveFine,
} from "../api/borrowRequests";
import { todayInLibrary } from "../utils/dates";
import { getQueuePosition } from "../api/borrowRequests";
import { useSocketEvent } from "../hooks/useSocketEvent";
import { SOCKET_EVENTS } from "../constants/socketEvents";

const WAITING = ["pending", "queued", "held"];

function DueDateForm({ request, disabled, onSave }) {
  const [dueDate, setDueDate] = useState(request.dueDate ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(dueDate);
      }}
    >
      <label htmlFor={`due-${request.id}`}>New due date</label>
      <input
        id={`due-${request.id}`}
        type="date"
        min={todayInLibrary()}
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
        required
      />
      <button
        type="submit"
        disabled={disabled || !dueDate || dueDate === request.dueDate}
      >
        Change due date
      </button>
    </form>
  );
}

function BorrowRequests() {
  const { user, can } = useCurrentUser();
  const staff = can("requests:seeAll");
  const [search, setSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState(staff ? "pending" : "all");
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const {
    items: requests,
    total,
    pageCount,
    status,
    error,
    reload,
  } = useBorrowRequests({
    page,
    search: debouncedSearch,
    status: requestStatus,
  });
  const filtered = debouncedSearch.trim() !== "" || requestStatus !== "all";
  const [positions, setPositions] = useState({});

  useEffect(() => {
    let active = true;
    const mine = requests.filter(
      (request) => request.status === "queued" && request.userId === user.id,
    );
    Promise.all(
      mine.map((request) =>
        getQueuePosition(request.id).then((response) => [
          request.id,
          response.data.data.position,
        ]),
      ),
    )
      .then((pairs) => {
        if (active) setPositions(Object.fromEntries(pairs));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [requests, user.id]);

  useSocketEvent(SOCKET_EVENTS.REQUEST_STATUS_CHANGED, reload);
  useSocketEvent(SOCKET_EVENTS.QUEUE_PROMOTED, reload);
  useSocketEvent(SOCKET_EVENTS.REQUEST_CREATED, reload);
  useSocketEvent(
    SOCKET_EVENTS.QUEUE_POSITION_CHANGED,
    ({ bookId, position }) => {
      const request = requests.find(
        (item) =>
          item.bookId === bookId &&
          item.status === "queued" &&
          item.userId === user.id,
      );
      if (request) {
        setPositions((current) => ({ ...current, [request.id]: position }));
      } else {
        reload();
      }
    },
  );

  const runAction = async (id, action) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (error) {
      setActionError({ id, message: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (request) => {
    const own = request.userId === user.id;
    const busy = busyId === request.id;
    const buttons = [];

    if (own && WAITING.includes(request.status)) {
      buttons.push(
        <button
          key="cancel"
          type="button"
          disabled={busy}
          onClick={() =>
            runAction(request.id, () => cancelBorrowRequest(request.id))
          }
        >
          Cancel
        </button>,
      );
    }
    // nobody decides their own request
    if (
      can("requests:decide") &&
      !own &&
      ["pending", "held"].includes(request.status)
    ) {
      for (const [decision, label] of [
        ["approved", "Approve"],
        ["rejected", "Reject"],
      ]) {
        buttons.push(
          <button
            key={decision}
            type="button"
            disabled={busy}
            onClick={() =>
              runAction(request.id, () =>
                decideBorrowRequest(request.id, decision),
              )
            }
          >
            {label}
          </button>,
        );
      }
    }
    if (can("requests:return") && request.status === "approved") {
      buttons.push(
        <button
          key="return"
          type="button"
          disabled={busy}
          onClick={() =>
            runAction(request.id, () => returnBorrowRequest(request.id))
          }
        >
          Mark returned
        </button>,
      );
    }
    if (can("requests:changeDueDate") && request.status === "approved") {
      buttons.push(
        <DueDateForm
          key="due-date"
          request={request}
          disabled={busy}
          onSave={(dueDate) =>
            runAction(request.id, () => changeDueDate(request.id, dueDate))
          }
        />,
      );
    }
    if (
      can("fines:waive") &&
      request.status === "returned" &&
      request.fine > 0
    ) {
      buttons.push(
        <button
          key="waive"
          type="button"
          disabled={busy}
          onClick={() => runAction(request.id, () => waiveFine(request.id))}
        >
          Waive fine
        </button>,
      );
    }
    return buttons;
  };

  return (
    <main>
      <h1>{staff ? "Approval queue" : "My borrow requests"}</h1>

      <label htmlFor="request-search">Search requests</label>
      <input
        id="request-search"
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder={staff ? "Book title or member name" : "Book title"}
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
              <BorrowRequestCard
                key={request.id}
                request={request}
                showMember={staff}
                position={positions[request.id]}
              >
                {actionsFor(request)}
                {actionError?.id === request.id && (
                  <p role="alert">{actionError.message}</p>
                )}
              </BorrowRequestCard>
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
