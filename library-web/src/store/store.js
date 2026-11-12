import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import booksReducer from "./booksSlice";
import authReducer, { sessionEnded } from "./authSlice";
import { setOnSessionEnd } from "../api/session";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    books: booksReducer,
    auth: authReducer,
  },
});

setOnSessionEnd(() => store.dispatch(sessionEnded()));
