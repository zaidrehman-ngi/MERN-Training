import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [
    { id: 1, title: "Book A", onShelf: 2 },
    { id: 2, title: "Book B", onShelf: 0 },
  ],
};

const booksSlice = createSlice({
  name: "books",
  initialState,
  reducers: {},
});

export default booksSlice.reducer;
