import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { clearAuthError, updatePassword } from '../store/authSlice';

export default function PasswordPage() {
  const dispatch = useDispatch();
  const error = useSelector((s) => s.auth.error);
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [ok, setOk] = useState(false);

  async function submit(e) {
    e.preventDefault();
    dispatch(clearAuthError());
    setOk(false);
    const result = await dispatch(updatePassword({ currentPassword, newPassword }));
    if (updatePassword.fulfilled.match(result)) {
      setOk(true);
      setCurrent('');
      setNew('');
    }
  }

  return (
    <div className="wizard">
      <p>
        <Link to="/" className="meta">
          ← Home
        </Link>
      </p>
      <form className="panel" onSubmit={submit} style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2>Change password</h2>
        {error && <p className="banner">{error}</p>}
        {ok && <p className="banner ok">Password updated.</p>}
        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required />
        </label>
        <button className="btn primary" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}
