import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import sessions from './sessionsSlice';

export const store = configureStore({
  reducer: { auth, sessions },
});
