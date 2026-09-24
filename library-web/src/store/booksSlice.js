import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  status: "idle",
  error: null,
  filter: "all",
  search: "",
};

const booksSlice = createSlice({
  name: "books",
  initialState,
  reducers: {
    booksLoaded: (state, action) => {
      state.items = action.payload;
    },

    bookAdded: (state, action) => {
      state.items.push(action.payload);
    },

    bookUpdated: (state, action) => {
      const index = state.items.findIndex(
        (book) => book.id === action.payload.id,
      );

      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    bookRemoved: (state, action) => {
      state.items = state.items.filter((book) => book.id !== action.payload);
    },

    filterChanged: (state, action) => {
      state.filter = action.payload;
    },

    searchChanged: (state, action) => {
      state.search = action.payload;
    },
  },
});

export const {
  booksLoaded,
  bookAdded,
  bookUpdated,
  bookRemoved,
  filterChanged,
  searchChanged,
} = booksSlice.actions;

export const selectAllBooks = (state) => state.books.items;
export const selectFilter = (state) => state.books.filter;
export const selectSearch = (state) => state.books.search;

export const selectFilteredBooks = createSelector(
  [selectAllBooks, selectFilter, selectSearch],
  (books, filter, search) => {
    const term = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesFilter = filter === "all" || book.status === filter;

      const haystack = `${book.title ?? ""} ${book.author ?? ""}`.toLowerCase();

      const matchesSearch = !term || haystack.includes(term);

      return matchesFilter && matchesSearch;
    });
  },
);

export default booksSlice.reducer;
