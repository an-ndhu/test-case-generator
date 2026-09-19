import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api/sessions';

export const fetchSessions = createAsyncThunk('sessions/list', () => api.listSessions());
export const fetchSession = createAsyncThunk('sessions/get', (id) => api.getSession(id));
export const createProject = createAsyncThunk('sessions/create', (body) => api.createSession(body));
export const patchProject = createAsyncThunk('sessions/patch', ({ id, ...payload }) =>
  api.saveSession(id, payload)
);
export const removeProject = createAsyncThunk('sessions/delete', async (id) => {
  await api.deleteSession(id);
  return id;
});
export const addProjectFile = createAsyncThunk('sessions/file', ({ id, file }) => api.uploadFile(id, file));
export const generateProject = createAsyncThunk('sessions/generate', (id) => api.generateSession(id));
export const regenerateProject = createAsyncThunk('sessions/regen', (id) => api.regenerateSession(id));

const slice = createSlice({
  name: 'sessions',
  initialState: {
    list: [],
    current: null,
    status: 'idle',
    error: '',
    notice: '',
  },
  reducers: {
    setCurrent(state, action) {
      state.current = action.payload;
    },
    clearNotice(state) {
      state.notice = '';
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'busy';
      state.error = '';
    };
    const failed = (state, action) => {
      state.status = 'error';
      state.error = action.error.message || 'Something went wrong.';
    };
    const ready = (state, action) => {
      state.status = 'idle';
      state.current = action.payload;
    };

    builder
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.list = action.payload;
      })
      .addCase(fetchSession.pending, (state) => {
        state.error = '';
      })
      .addCase(fetchSession.fulfilled, ready)
      .addCase(fetchSession.rejected, failed)
      .addCase(createProject.pending, pending)
      .addCase(createProject.fulfilled, ready)
      .addCase(createProject.rejected, failed)
      .addCase(patchProject.fulfilled, ready)
      .addCase(patchProject.rejected, failed)
      .addCase(addProjectFile.pending, pending)
      .addCase(addProjectFile.fulfilled, ready)
      .addCase(addProjectFile.rejected, failed)
      .addCase(generateProject.pending, pending)
      .addCase(generateProject.fulfilled, ready)
      .addCase(generateProject.rejected, failed)
      .addCase(regenerateProject.pending, pending)
      .addCase(regenerateProject.fulfilled, (state, action) => {
        state.status = 'idle';
        state.current = action.payload;
        state.notice = 'Regenerated.';
      })
      .addCase(regenerateProject.rejected, failed)
      .addCase(removeProject.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
        if (state.current?._id === action.payload) state.current = null;
      });
  },
});

export const { setCurrent, clearNotice } = slice.actions;
export default slice.reducer;
