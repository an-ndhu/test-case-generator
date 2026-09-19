import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as api from '../api/sessions';
import auth from '../store/authSlice';
import sessions from '../store/sessionsSlice';
import NamePage from './NamePage';

jest.mock('../api/sessions');

const current = {
  _id: 's1',
  title: 'Untitled project',
  contextNote: '',
  step: 'name',
  latestStep: 'name',
  design: {},
};

function renderPage() {
  api.getSession.mockResolvedValue(current);
  api.saveSession.mockResolvedValue({ ...current, title: 'Payments', step: 'context' });

  const store = configureStore({
    reducer: { auth, sessions },
    preloadedState: {
      auth: { user: { name: 'Ada' }, ready: true, error: '' },
      sessions: { list: [], current, status: 'idle', error: '', notice: '' },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/projects/s1/name']}
      >
        <Routes>
          <Route path="/projects/:id/name" element={<NamePage />} />
          <Route path="/projects/:id/context" element={<div>context page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  return store;
}

describe('NamePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an error and does not patch when the name is empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Enter a project name to continue.')).toBeInTheDocument();
    expect(api.saveSession).not.toHaveBeenCalled();
  });

  it('patches and continues with a valid name', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText('Enter Project Name'), 'Payments');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(api.saveSession).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ title: 'Payments', step: 'context' })
    );
    expect(await screen.findByText('context page')).toBeInTheDocument();
  });
});
