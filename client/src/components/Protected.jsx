import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { fetchMe } from '../store/authSlice';

export default function Protected() {
  const dispatch = useDispatch();
  const { user, ready } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (!ready) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
