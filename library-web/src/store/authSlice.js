import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginUser, logoutUser, refreshSession } from "../api/auth";
import { setAccessToken } from "../api/session";
import socket from "../api/socket";

const startSession = ({ accessToken, user }) => {
  setAccessToken(accessToken);
  socket.disconnect().connect();
  return user;
};

const endSession = () => {
  setAccessToken(null);
  socket.disconnect();
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);
      return startSession(response.data);
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshSession();
      return startSession(response.data);
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutUser();
  } finally {
    endSession();
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, status: "checking" },
  reducers: {
    sessionEnded: (state) => {
      state.user = null;
      state.status = "expired";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "signedIn";
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "signedIn";
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.status = "signedOut";
      })
      .addCase(logout.pending, (state) => {
        state.user = null;
        state.status = "signedOut";
      });
  },
});

export const { sessionEnded } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;

export default authSlice.reducer;
