import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api/auth';

export const fetchMe = createAsyncThunk('auth/me', () => api.me());
export const loginUser = createAsyncThunk('auth/login', (body) => api.login(body));
export const registerUser = createAsyncThunk('auth/register', (body) => api.register(body));
export const logoutUser = createAsyncThunk('auth/logout', () => api.logout());
export const updatePassword = createAsyncThunk('auth/password', (body) => api.changePassword(body));

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, ready: false, error: '' },
  reducers: {
    clearAuthError(state) {
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.ready = true;
        state.error = '';
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.ready = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = '';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = '';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.error = '';
      });
  },
});

export const { clearAuthError } = slice.actions;
export default slice.reducer;
