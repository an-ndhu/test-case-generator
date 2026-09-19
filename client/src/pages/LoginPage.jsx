import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { clearAuthError, fetchMe, loginUser } from '../store/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error } = useSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) navigate('/');
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Sign in to MELO</h1>
        {error && <p className="banner">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn primary" type="submit">
          Log in
        </button>
        <p className="meta">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
