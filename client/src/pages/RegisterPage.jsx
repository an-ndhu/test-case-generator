import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { clearAuthError, fetchMe, registerUser } from '../store/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error } = useSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(result)) navigate('/');
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your MELO account</h1>
        {error && <p className="banner">{error}</p>}
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password (8+ characters)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn primary" type="submit">
          Register
        </button>
        <p className="meta">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
