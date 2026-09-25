import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createBook, listBooks, removeBook, updateBook } from "../api/books";

export const fetchBooks = createAsyncThunk(
  "books/fetchBooks",
  async ({ filter = "all", search = "" } = {}, { rejectWithValue }) => {
    try {
      const response = await listBooks({ filter, search });
      return response.data;
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

const initialState = {
  items: [],
  status: "idle",
  error: null,
  filter: "all",
  search: "",
  currentRequestId: null,
};

const booksSlice = createSlice({
  name: "books",

  initialState,

  reducers: {
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
        state.items.push(action.payload);
      })

      .addCase(updateBookThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (book) => book.id === action.payload.id,
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      .addCase(deleteBookThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((book) => book.id !== action.payload);
      });
  },
});

export const {
  bookAdded,
  bookUpdated,
  bookRemoved,
  filterChanged,
  searchChanged,
} = booksSlice.actions;

export const selectAllBooks = (state) => state.books.items;
export const selectFilter = (state) => state.books.filter;
export const selectSearch = (state) => state.books.search;
export const selectBooksStatus = (state) => state.books.status;
export const selectBooksError = (state) => state.books.error;

export default booksSlice.reducer;
