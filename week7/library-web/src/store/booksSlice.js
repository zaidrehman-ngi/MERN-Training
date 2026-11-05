import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createBook, listBooks, removeBook, updateBook } from "../api/books";
import { createBorrowRequest } from "../api/borrowRequests";

export const fetchBooks = createAsyncThunk(
  "books/fetchBooks",
  async ({ filter = "all", search = "" } = {}, { rejectWithValue }) => {
    try {
      const response = await listBooks({ filter, search });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const createBookThunk = createAsyncThunk(
  "books/createBook",
  async (book, { rejectWithValue }) => {
    try {
      const response = await createBook(book);
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
  {
    condition: ({ bookId }, { getState }) => {
      const status = getState().books.borrowStatusByBookId[bookId];
      return status !== "pending" && status !== "succeeded";
    },
  },
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  filter: "all",
  search: "",
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
    bookAdded: (state, action) => {
      if (!state.items.some((book) => book.id === action.payload.id)) {
        state.items.push(action.payload);
      }
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
    },

    searchChanged: (state, action) => {
      state.search = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })

      .addCase(fetchBooks.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.status = "succeeded";
        state.items = action.payload;
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
        const index = state.items.findIndex(
          (book) => book.id === action.payload.id,
        );

        if (index === -1) {
          state.items.push(action.payload);
        } else {
          state.items[index] = action.payload;
        }
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
        const index = state.items.findIndex(
          (book) => book.id === action.payload.id,
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
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
        state.items = state.items.filter((book) => book.id !== action.payload);
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
        state.borrowStatusByBookId[bookId] = "succeeded";
      })

      .addCase(borrowBookThunk.rejected, (state, action) => {
        if (action.meta.condition) {
          return;
        }

        const { bookId } = action.meta.arg;
        delete state.borrowStatusByBookId[bookId];
        state.borrowErrorByBookId[bookId] = action.payload;
      });
  },
});

export const {
  bookAdded,
  bookUpdated,
  bookRemoved,
  resetBookMutation,
  filterChanged,
  searchChanged,
} = booksSlice.actions;

export const selectAllBooks = (state) => state.books.items;
export const selectFilter = (state) => state.books.filter;
export const selectSearch = (state) => state.books.search;
export const selectBooksStatus = (state) => state.books.status;
export const selectBooksError = (state) => state.books.error;

export default booksSlice.reducer;
