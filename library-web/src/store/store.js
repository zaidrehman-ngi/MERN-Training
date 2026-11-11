import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import booksReducer from "./booksSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    books: booksReducer,
    auth: authReducer,
  },
});
