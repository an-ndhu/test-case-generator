import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { canGoForward, nextOf, previousOf } from '../api/steps';
import { patchProject } from '../store/sessionsSlice';

export default function StepBack({ id, current }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const latestStep = useSelector((s) => s.sessions.current?.latestStep || s.sessions.current?.step);
  const prev = previousOf(current);
  const nxt = nextOf(current);
  const showForward = nxt && canGoForward(current, latestStep);

  async function go(entry) {
    if (!entry) return;
    const path = typeof entry.path === 'function' ? entry.path(id) : entry.path;
    if (entry.step && id) {
      await dispatch(patchProject({ id, step: entry.step }));
    }
    navigate(path);
  }

  return (
    <div className="step-nav">
      {prev && (
        <button type="button" className="btn back-btn" onClick={() => go(prev)}>
          ← Back
        </button>
      )}
      {showForward && (
        <button type="button" className="btn primary back-btn" onClick={() => go(nxt)}>
          Forward →
        </button>
      )}
    </div>
  );
}
