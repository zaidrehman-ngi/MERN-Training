import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import booksReducer, {
  availabilityChanged,
  borrowRequestClosed,
  borrowStatusLoaded,
} from "./booksSlice";
import authReducer, { sessionEnded } from "./authSlice";
import { setOnSessionEnd } from "../api/session";
import socket from "../api/socket";
import { SOCKET_EVENTS } from "../constants/socketEvents";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    books: booksReducer,
    auth: authReducer,
  },
});

setOnSessionEnd(() => store.dispatch(sessionEnded()));

// socket events land here, once, so every screen reads the same numbers
socket.on(SOCKET_EVENTS.BOOK_AVAILABILITY_CHANGED, (payload) =>
  store.dispatch(availabilityChanged(payload)),
);

const CLOSED = ["cancelled", "rejected", "expired", "returned"];
const isMine = (payload) => payload.userId === store.getState().auth.user?.id;

socket.on(SOCKET_EVENTS.REQUEST_STATUS_CHANGED, (payload) => {
  if (!isMine(payload)) return;
  if (CLOSED.includes(payload.status)) {
    store.dispatch(borrowRequestClosed(payload));
  } else if (payload.status === "approved") {
    store.dispatch(
      borrowStatusLoaded({ bookId: payload.bookId, status: "approved" }),
    );
  }
});

socket.on(SOCKET_EVENTS.QUEUE_PROMOTED, (payload) => {
  if (isMine(payload)) {
    store.dispatch(
      borrowStatusLoaded({ bookId: payload.bookId, status: "held" }),
    );
  }
});
