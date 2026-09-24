import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import booksReducer from "./booksSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    books: booksReducer,
  },
});
