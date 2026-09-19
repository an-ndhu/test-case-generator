import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchSession } from '../store/sessionsSlice';

export function useProject() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, status, error, notice } = useSelector((s) => s.sessions);

  useEffect(() => {
    if (id) dispatch(fetchSession(id));
  }, [dispatch, id]);

  return { id, current, status, error, notice, dispatch };
}
