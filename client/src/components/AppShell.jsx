import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/authSlice';

export default function AppShell() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  async function logout() {
    await dispatch(logoutUser());
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <Link to="/" className="logo" title="MELO">
            <span className="material-symbols-outlined">auto_awesome</span>
          </Link>
          <nav className="nav">
            <button
              className="nav-btn active"
              type="button"
              title="Test Case Generation"
              onClick={() => navigate('/')}
            >
              <span className="material-symbols-outlined">task_alt</span>
            </button>
          </nav>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="crumb">
            <span className="ft">FT</span>
            <span style={{ color: '#d1d5db' }}>/</span>
            <span>MELO</span>
          </div>
          <div className="header-actions">
            <div
              className="user-chip"
              onClick={(e) => {
                e.stopPropagation();
                setMenu((v) => !v);
              }}
            >
              <span className="avatar" />
              {user?.name || 'Account'}
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                expand_more
              </span>
              {menu && (
                <div className="user-menu">
                  <Link to="/account/password">Change password</Link>
                  <button type="button" onClick={logout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="canvas">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
