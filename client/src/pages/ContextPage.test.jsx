import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as api from '../api/sessions';
import auth from '../store/authSlice';
import sessions from '../store/sessionsSlice';
import ContextPage from './ContextPage';

jest.mock('../api/sessions');

const current = {
  _id: 's1',
  title: 'Payments',
  contextNote: '',
  requirementText: '',
  files: [],
  step: 'context',
  latestStep: 'context',
  design: {},
};

function renderPage(session = current) {
  api.getSession.mockResolvedValue(session);
  api.saveSession.mockResolvedValue({ ...session, step: 'design', contextNote: 'User can pay' });

  const store = configureStore({
    reducer: { auth, sessions },
    preloadedState: {
      auth: { user: { name: 'Ada' }, ready: true, error: '' },
      sessions: { list: [], current: session, status: 'idle', error: '', notice: '' },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/projects/s1/context']}
      >
        <Routes>
          <Route path="/projects/:id/context" element={<ContextPage />} />
          <Route path="/projects/:id/design" element={<div>design page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('ContextPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an error when continuing with no file or note', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Add a file or describe the context.')).toBeInTheDocument();
    expect(api.saveSession).not.toHaveBeenCalled();
  });

  it('patches and continues when a note is provided', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText('Input the context here'), 'User can pay');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(api.saveSession).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ contextNote: 'User can pay', step: 'design' })
    );
    expect(await screen.findByText('design page')).toBeInTheDocument();
  });
});
