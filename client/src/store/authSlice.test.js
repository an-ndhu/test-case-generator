import { configureStore } from '@reduxjs/toolkit';
import * as api from '../api/auth';
import reducer, { fetchMe, loginUser, logoutUser, registerUser, updatePassword } from './authSlice';

jest.mock('../api/auth');

function store(preloaded) {
  return configureStore({
    reducer: { auth: reducer },
    preloadedState: preloaded ? { auth: preloaded } : undefined,
  });
}

const user = { _id: 'u1', name: 'Ada', email: 'ada@example.com' };

describe('authSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('positive', () => {
    it('stores the user after register and login', async () => {
      api.register.mockResolvedValue(user);
      api.login.mockResolvedValue(user);
      const s = store();
      await s.dispatch(registerUser({ email: 'ada@example.com', password: 'password1', name: 'Ada' }));
      expect(s.getState().auth.user).toEqual(user);
      await s.dispatch(loginUser({ email: 'ada@example.com', password: 'password1' }));
      expect(s.getState().auth.user.email).toBe('ada@example.com');
    });

    it('marks ready after fetchMe succeeds', async () => {
      api.me.mockResolvedValue(user);
      const s = store();
      await s.dispatch(fetchMe());
      expect(s.getState().auth.ready).toBe(true);
      expect(s.getState().auth.user).toEqual(user);
    });

    it('clears the user on logout', async () => {
      api.logout.mockResolvedValue({ ok: true });
      const s = store({ user, ready: true, error: '' });
      await s.dispatch(logoutUser());
      expect(s.getState().auth.user).toBeNull();
    });
  });

  describe('negative', () => {
    it('sets error when login fails', async () => {
      api.login.mockRejectedValue(new Error('Email or password is incorrect.'));
      const s = store();
      await s.dispatch(loginUser({ email: 'x@y.com', password: 'nope' }));
      expect(s.getState().auth.error).toBe('Email or password is incorrect.');
    });

    it('clears user but still becomes ready when fetchMe fails', async () => {
      api.me.mockRejectedValue(new Error('Please log in.'));
      const s = store({ user, ready: false, error: '' });
      await s.dispatch(fetchMe());
      expect(s.getState().auth.user).toBeNull();
      expect(s.getState().auth.ready).toBe(true);
    });

    it('sets error when password update fails', async () => {
      api.changePassword.mockRejectedValue(new Error('Current password is incorrect.'));
      const s = store({ user, ready: true, error: '' });
      await s.dispatch(updatePassword({ currentPassword: 'x', newPassword: 'password2' }));
      expect(s.getState().auth.error).toBe('Current password is incorrect.');
    });
  });
});
