import { configureStore } from '@reduxjs/toolkit';
import * as api from '../api/sessions';
import reducer, {
  createProject,
  fetchSession,
  generateProject,
  patchProject,
  regenerateProject,
  removeProject,
} from './sessionsSlice';

jest.mock('../api/sessions');

function store(preloaded) {
  return configureStore({
    reducer: { sessions: reducer },
    preloadedState: preloaded ? { sessions: preloaded } : undefined,
  });
}

const session = { _id: 's1', title: 'Demo', workflows: [] };

describe('sessionsSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('positive', () => {
    it('stores current after create, fetch, patch, and generate', async () => {
      api.createSession.mockResolvedValue(session);
      api.getSession.mockResolvedValue({ ...session, step: 'name' });
      api.saveSession.mockResolvedValue({ ...session, title: 'Renamed' });
      api.generateSession.mockResolvedValue({ ...session, step: 'workflows' });

      const s = store();
      await s.dispatch(createProject({ title: 'Demo' }));
      expect(s.getState().sessions.current._id).toBe('s1');
      expect(s.getState().sessions.status).toBe('idle');

      await s.dispatch(fetchSession('s1'));
      expect(s.getState().sessions.current.step).toBe('name');

      await s.dispatch(patchProject({ id: 's1', title: 'Renamed' }));
      expect(s.getState().sessions.current.title).toBe('Renamed');

      await s.dispatch(generateProject('s1'));
      expect(s.getState().sessions.current.step).toBe('workflows');
    });

    it('sets notice after regenerate', async () => {
      api.regenerateSession.mockResolvedValue({ ...session, step: 'workflows' });
      const s = store();
      await s.dispatch(regenerateProject('s1'));
      expect(s.getState().sessions.notice).toBe('Regenerated.');
    });

    it('removes a session from the list and clears current when ids match', async () => {
      api.deleteSession.mockResolvedValue({ ok: true });
      const s = store({
        list: [session, { _id: 's2', title: 'Other' }],
        current: session,
        status: 'idle',
        error: '',
        notice: '',
      });
      await s.dispatch(removeProject('s1'));
      expect(s.getState().sessions.list).toEqual([{ _id: 's2', title: 'Other' }]);
      expect(s.getState().sessions.current).toBeNull();
    });
  });

  describe('negative', () => {
    it('sets error when create fails', async () => {
      api.createSession.mockRejectedValue(new Error('Request failed.'));
      const s = store();
      await s.dispatch(createProject({}));
      expect(s.getState().sessions.status).toBe('error');
      expect(s.getState().sessions.error).toBe('Request failed.');
    });

    it('does not clear current when a different session is deleted', async () => {
      api.deleteSession.mockResolvedValue({ ok: true });
      const s = store({
        list: [session, { _id: 's2' }],
        current: session,
        status: 'idle',
        error: '',
        notice: '',
      });
      await s.dispatch(removeProject('s2'));
      expect(s.getState().sessions.current._id).toBe('s1');
    });
  });
});
