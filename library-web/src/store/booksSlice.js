import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { createBook, listBooks, removeBook, updateBook } from "../api/books";
import { createBorrowRequest } from "../api/borrowRequests";

export const fetchBooks = createAsyncThunk(
  "books/fetchBooks",
  async (
    { filter = "all", search = "", page = 1 } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await listBooks({ filter, search, page });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
  { getPendingMeta: () => ({ startedAt: Date.now() }) },
);

export const createBookThunk = createAsyncThunk(
  "books/createBook",
  async (book, { rejectWithValue }) => {
    try {
      const response = await createBook(book);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const updateBookThunk = createAsyncThunk(
  "books/updateBook",
  async ({ id, book }, { rejectWithValue }) => {
    try {
      const response = await updateBook(id, book);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const deleteBookThunk = createAsyncThunk(
  "books/deleteBook",
  async (id, { rejectWithValue }) => {
    try {
      await removeBook(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const borrowBookThunk = createAsyncThunk(
  "books/borrow",
  async ({ request }, { rejectWithValue }) => {
    try {
      const response = await createBorrowRequest(request);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
  {
    condition: ({ bookId }, { getState }) => {
      const status = getState().books.borrowStatusByBookId[bookId];
      return !["pending", "succeeded", "queued"].includes(status);
    },
  },
);

// every book the app has seen, once, by id; the catalogue page keeps only its ids
// a response for a request sent before the last event is older than that
// event, so it doesn't get to overwrite the copies
const saveBook = (state, book, requestedAt) => {
  const eventAt = state.eventAtById[book.id];
  const current = state.byId[book.id];
  state.byId[book.id] =
    current && eventAt > requestedAt
      ? { ...book, onShelf: current.onShelf }
      : book;
};

const initialState = {
  byId: {},
  ids: [],
  eventAtById: {},
  requestStartedAt: null,
  status: "idle",
  error: null,
  filter: "all",
  search: "",
  page: 1,
  total: 0,
  limit: 10,
  currentRequestId: null,
  borrowStatusByBookId: {},
  borrowErrorByBookId: {},
  createStatus: "idle",
  createError: null,
  updateStatusById: {},
  updateErrorById: {},
  deleteStatusById: {},
  deleteErrorById: {},
};

const booksSlice = createSlice({
  name: "books",

  initialState,

  reducers: {
    bookLoaded: {
      reducer: (state, action) => {
        saveBook(state, action.payload.book, action.payload.requestedAt);
      },
      prepare: (book, requestedAt) => ({ payload: { book, requestedAt } }),
    },

    availabilityChanged: {
      reducer: (state, action) => {
        const { bookId, available, receivedAt } = action.payload;
        state.eventAtById[bookId] = receivedAt;
        const book = state.byId[bookId];
        if (book) {
          book.onShelf = available;
        }
      },
      prepare: (payload) => ({
        payload: { ...payload, receivedAt: Date.now() },
      }),
    },

    borrowStatusLoaded: (state, action) => {
      const { bookId, status } = action.payload;
      if (state.borrowStatusByBookId[bookId] !== "pending") {
        state.borrowStatusByBookId[bookId] = status;
      }
    },

    // the request is over (cancelled, rejected, expired, returned), so the
    // member can ask for the book again
    borrowRequestClosed: (state, action) => {
      delete state.borrowStatusByBookId[action.payload.bookId];
    },

    resetBookMutation: (state, action) => {
      const { operation, id } = action.payload;

      if (operation === "create") {
        state.createStatus = "idle";
        state.createError = null;
      } else if (operation === "update") {
        delete state.updateStatusById[id];
        delete state.updateErrorById[id];
      } else if (operation === "delete") {
        delete state.deleteStatusById[id];
        delete state.deleteErrorById[id];
      }
    },

    filterChanged: (state, action) => {
      state.filter = action.payload;
      state.page = 1;
    },

    searchChanged: (state, action) => {
      state.search = action.payload;
      state.page = 1;
    },

    pageChanged: (state, action) => {
      state.page = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.currentRequestId = action.meta.requestId;
        state.requestStartedAt = action.meta.startedAt;
      })

      .addCase(fetchBooks.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.status = "succeeded";
        for (const book of action.payload.data) {
          saveBook(state, book, state.requestStartedAt);
        }
        state.ids = action.payload.data.map((book) => book.id);
        state.total = action.payload.meta.total;
        state.limit = action.payload.meta.limit;
        state.currentRequestId = null;
      })

      .addCase(fetchBooks.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.status = "failed";
        state.error = action.payload;
        state.currentRequestId = null;
      })

      .addCase(createBookThunk.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.createError = null;
        state.byId[action.payload.id] = action.payload;
      })

      .addCase(createBookThunk.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })

      .addCase(createBookThunk.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      })

      .addCase(updateBookThunk.pending, (state, action) => {
        const { id } = action.meta.arg;
        state.updateStatusById[id] = "loading";
        delete state.updateErrorById[id];
      })

      .addCase(updateBookThunk.fulfilled, (state, action) => {
        const { id } = action.meta.arg;
        state.updateStatusById[id] = "succeeded";
        delete state.updateErrorById[id];
        state.byId[action.payload.id] = action.payload;
      })

      .addCase(updateBookThunk.rejected, (state, action) => {
        const { id } = action.meta.arg;
        state.updateStatusById[id] = "failed";
        state.updateErrorById[id] = action.payload;
      })

      .addCase(deleteBookThunk.pending, (state, action) => {
        const id = action.meta.arg;
        state.deleteStatusById[id] = "loading";
        delete state.deleteErrorById[id];
      })

      .addCase(deleteBookThunk.fulfilled, (state, action) => {
        state.deleteStatusById[action.payload] = "succeeded";
        delete state.deleteErrorById[action.payload];
        delete state.byId[action.payload];
        state.ids = state.ids.filter((id) => id !== action.payload);
      })

      .addCase(deleteBookThunk.rejected, (state, action) => {
        const id = action.meta.arg;
        state.deleteStatusById[id] = "failed";
        state.deleteErrorById[id] = action.payload;
      })

      .addCase(borrowBookThunk.pending, (state, action) => {
        const { bookId } = action.meta.arg;
        state.borrowStatusByBookId[bookId] = "pending";
        delete state.borrowErrorByBookId[bookId];
      })

      .addCase(borrowBookThunk.fulfilled, (state, action) => {
        const { bookId } = action.meta.arg;
        // the server decides: pending if a copy was free, queued if not
        state.borrowStatusByBookId[bookId] =
          action.payload.status === "queued" ? "queued" : "succeeded";
      })

      .addCase(borrowBookThunk.rejected, (state, action) => {
        if (action.meta.condition) {
          return;
        }

        const { bookId } = action.meta.arg;
        delete state.borrowStatusByBookId[bookId];
        state.borrowErrorByBookId[bookId] = action.payload;
      })

      // borrow state belongs to whoever was logged in, not to the next user
      .addMatcher(
        (action) =>
          action.type === "auth/logout/pending" ||
          action.type === "auth/sessionEnded" ||
          action.type === "auth/login/fulfilled",
        (state) => {
          state.borrowStatusByBookId = {};
          state.borrowErrorByBookId = {};
        },
      );
  },
});

export const {
  bookLoaded,
  availabilityChanged,
  borrowRequestClosed,
  borrowStatusLoaded,
  resetBookMutation,
  filterChanged,
  searchChanged,
  pageChanged,
} = booksSlice.actions;

export const selectAllBooks = createSelector(
  [(state) => state.books.ids, (state) => state.books.byId],
  (ids, byId) => ids.map((id) => byId[id]).filter(Boolean),
);
export const selectBookById = (state, id) => state.books.byId[id];
export const selectFilter = (state) => state.books.filter;
export const selectSearch = (state) => state.books.search;
export const selectPage = (state) => state.books.page;
export const selectTotal = (state) => state.books.total;
export const selectPageCount = (state) =>
  Math.max(1, Math.ceil(state.books.total / state.books.limit));
export const selectBooksStatus = (state) => state.books.status;
export const selectBooksError = (state) => state.books.error;

export default booksSlice.reducer;
