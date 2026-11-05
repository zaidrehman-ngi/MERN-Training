import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedBranch: "Main Branch",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSelectedBranch: (state, action) => {
      state.selectedBranch = action.payload;
    },
  },
});

export const { setSelectedBranch } = uiSlice.actions;

export default uiSlice.reducer;
